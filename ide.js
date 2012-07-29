
// global ide object

var ide = new(function() {
  // == private members ==
  var codeEditor = null;
  var jsEditor = null;
  var logViewer = null;
  var dataViewer = null;
  // == public members ==
  this.map = null;

  // == private methods ==
  var init = function() {
    // init codemirror
    codeEditor = CodeMirror($("#overpass_editor")[0], {
      value: (settings.code["overpass"] !== null) ?
        settings.code["overpass"] :
        examples[examples_initial_example]["overpass"],
      lineNumbers: true,
      mode: "xml",
      onChange: function(e) {
        settings.code["overpass"] = e.getValue();
        settings.save();
      },
    });
    jsEditor = CodeMirror($("#js_editor")[0], {
      value: (settings.code["js"] !== null) ?
        settings.code["js"] :
        examples[examples_initial_example]["js"],
      lineNumbers: true,
      mode: "javascript",
      onChange: function(e) {
        settings.code["js"] = e.getValue();
        settings.save();
      },
    });
    dataViewer = CodeMirror($("#data")[0], {
      value:'no data loaded yet', 
      lineNumbers: true, 
      readOnly: true,
      mode: "javascript",
    });
    logViewer = CodeMirror($("#log")[0], {
      value:'',
      lineNumbers: true,
      readOnly: true,
      mode: "",
    });

    // init leaflet
    ide.map = new L.Map("map");
    var osmUrl="http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    var osmAttrib="Map data © openstreetmap contributors";
    var osm = new L.TileLayer(osmUrl,{minZoom:4,maxZoom:18,attribution:osmAttrib});
    var pos = new L.LatLng(settings.coords_lat,settings.coords_lon);
    ide.map.setView(pos,settings.coords_zoom).addLayer(osm);
    if (settings.use_html5_coords) {
      // One-shot position request.
      try {
        navigator.geolocation.getCurrentPosition(function (position){
          var pos = new L.LatLng(position.coords.latitude,position.coords.longitude);
          ide.map.setView(pos,settings.coords_zoom);
        });
      } catch(e) {}
    }
    ide.map.on('moveend', function() {
      settings.coords_lat = ide.map.getCenter().lat;
      settings.coords_lon = ide.map.getCenter().lng;
      settings.coords_zoom = ide.map.getZoom();
      settings.save(); // save settings
    });

    // disabled buttons
    $("a.disabled").bind("click",function() { return false; });

    // tabs
    $("#dataviewer > div#data")[0].style.zIndex = -99;
    $(".tabs a.button").bind("click",function(e) {
      if ($(e.target).hasClass("active")) {
        return;
      } else {
        $(".tabs a.button").removeClass("active");
        $("#dataviewer > div").each(function(i,d) {d.style.zIndex = -99});
        $(e.target).addClass("active");
        $("#dataviewer > div#"+e.target.innerHTML.toLowerCase())[0].style.zIndex = 0;
      }
    });

    // wait spinner
    $("body").on({
      ajaxStart: function() {
        $(this).addClass("loading");
      },
      ajaxStop: function() {
        $(this).removeClass("loading");
      },
    });

  }
  var overpassJSON2geoJSON = function(json) {
    // 2. sort elements
    var nodes = new Array();
    var ways  = new Array();
    var rels  = new Array();
    for (var i=0;i<json.elements.length;i++) {
      switch (json.elements[i].type) {
        case "node":
          nodes.push(json.elements[i]);
          break;
        case "way":
          ways.push(json.elements[i]);
          break;
        case "relation":
          rels.push(json.elements[i]);
          break;
        default:
          //alert("???");
      }
    }

    // 3. some data processing (e.g. filter nodes only used for ways)
    var nids = new Object();
    var nodeids = new Array();
    for (var i=0;i<nodes.length;i++) {
      nids[nodes[i].id] = nodes[i];
      nodeids.push(nodes[i].id);
    }
    var poinids = new Array();
    for (var i=0;i<nodes.length;i++) {
      if (typeof nodes[i].tags != 'undefined')
        poinids.push(nodes[i].id);
    }
    var waynids = new Array();
    var wayids = new Array();
    for (var i=0;i<ways.length;i++) {
      wayids.push(ways[i].id);
      for (var j=0;j<ways[i].nodes.length;j++) {
        waynids.push(ways[i].nodes[j]);
        ways[i].nodes[j] = nids[ways[i].nodes[j]];
      }
    }
    var pois = new Array();
    for (var i=0;i<nodes.length;i++) {
      if ((waynids.indexOf(nodes[i].id) == -1) || // not related to any way
          (poinids.indexOf(nodes[i].id) != -1))   // or has tags
        pois.push(nodes[i]);
    }
    var relids = new Array();
    for (var i=0;i<rels.length;i++) {
      relids.push(rels[i].id);
      for (var j=0;j<rels[i].members.length;j++) {
        switch (rels[i].members[j].type) {
        case "node":
          n = nodeids.indexOf(rels[i].members[j].ref);
          if (n != -1) {
            if (typeof nodes[n].relations == "undefined")
              nodes[n].relations = new Array();
            nodes[n].relations.push({
              "rel" : rels[i].id,
              "role" : rels[i].members[j].role,
            });
          }
        break;
        case "way":
          w = wayids.indexOf(rels[i].members[j].ref);
          if (w != -1) {
            if (typeof ways[w].relations == "undefined")
              ways[w].relations = new Array();
            ways[w].relations.push({
              "rel" : rels[i].id,
              "role" : rels[i].members[j].role,
            });
          }
        break;
        default:
        }
      }
    }

    // 4. construct geojson
    var geojson = new Array();
    var geojsonnodes = {
      "type"     : "FeatureCollection",
      "features" : new Array()};
    for (i=0;i<pois.length;i++) {
      geojsonnodes.features.push({
        "type"       : "Feature",
        "properties" : {
          "tags" : pois[i].tags,
          "relations" : pois[i].relations,
        },
        "id"         : pois[i].id,
        "geometry"   : {
          "type" : "Point",
          "coordinates" : [pois[i].lon, pois[i].lat],
        }
      });
    }
    geojson.push(geojsonnodes);
    var geojsonways = {
      "type"     : "FeatureCollection",
      "features" : new Array()};
    for (var i=0;i<ways.length;i++) {
      ways[i].tainted = false;
      coords = new Array();
      for (j=0;j<ways[i].nodes.length;j++) {
        if (typeof ways[i].nodes[j] == "object")
          coords.push([ways[i].nodes[j].lon, ways[i].nodes[j].lat]);
        else
          ways[i].tainted = true;
      }

      var way_type = "LineString"; // default
      if (ways[i].nodes[0] == ways[i].nodes[ways[i].nodes.length-1]) {
        if (typeof ways[i].tags != "undefined")
          if ((typeof ways[i].tags["landuse"] != "undefined") ||
              (typeof ways[i].tags["building"] != "undefined") ||
              (typeof ways[i].tags["leisure"] != "undefined") ||
              (typeof ways[i].tags["area"] == "yes") ||
              ($.inArray(ways[i].tags["natural"], new Array("forest","wood","water"))) ||
              false) {
             way_type="Polygon";
             coords = [coords];
           }
      }
      geojsonways.features.push({
        "type"       : "Feature",
        "properties" : {
          "tainted" : ways[i].tainted,
          "tags" : ways[i].tags,
          "relations" : ways[i].relations,
        },
        "id"         : ways[i].id,
        "geometry"   : {
          "type" : way_type,
          "coordinates" : coords,
        }
      });
    }
    geojson.push(geojsonways);

    return geojson;
  }

  // == public methods ==

  // returns the current visible bbox
  this.map2bbox = function(lang) {
    if (lang=="ql")
      return "("+this.map.getBounds().getSouthWest().lat+','+this.map.getBounds().getSouthWest().lng+','+this.map.getBounds().getNorthEast().lat+','+this.map.getBounds().getNorthEast().lng+")";
    else (lang=="xml")
      return '<bbox-query s="'+this.map.getBounds().getSouthWest().lat+'" w="'+this.map.getBounds().getSouthWest().lng+'" n="'+this.map.getBounds().getNorthEast().lat+'" e="'+this.map.getBounds().getNorthEast().lng+'"/>';
  }
  this.setData = function(val) {
    dataViewer.setValue(val);
  }
  this.getQuery = function() {
    return codeEditor.getValue();
  }
  this.getScript = function() {
    return jsEditor.getValue();
  }
  this.setQuery = function(query) {
    codeEditor.setValue(query);
  }
  this.setScript = function(js) {
    jsEditor.setValue(js);
  }
  this.log = function(str) {
    logViewer.setLine(logViewer.lineCount()-1,str+"\n");
  }
  this.clearLog = function() {
    logViewer.setValue("");
  }


  // Event handlers
  this.onLoadClick = function() {
    var ex_html = "";
    for(var example in examples)
      ex_html += '<li><input type="radio" name="ex_list" value="'+example+'" />'+example+'</li>';
    $('<div title="Load"><p>Select example to load:</p><ul>'+ex_html+'</ul></div>').dialog({
      modal:true,
      height:250,
      buttons: {
        "Load" : function() {
          $("input",this).each(function(i,inp) {
            if (inp.checked) {
              ide.setQuery(examples[inp.value].overpass);
              if (typeof examples[inp.value].js != "undefined")
                ide.setScript(examples[inp.value].js);
              else
                ide.setScript("");
            }
          });
          $(this).dialog("close");
        },
        "Cancel" : function() {$(this).dialog("close");}
      }
    });
    
  }
  this.onRunClick = function() {
    overpass.update_map();
  }

  // == initializations ==
  // initialize on document ready
  $(document).ready(init);

})(); // end create ide object













