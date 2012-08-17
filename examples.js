examples = {
  "Drinking Water in bbox":  {
    "overpass": '<osm-script output="json">\n  <query type="node">\n    <has-kv k="amenity" v="drinking_water"/>\n    <bbox-query/>\n  </query>\n  <print mode="body" order="quadtile"/>\n</osm-script>',
  },
  "Drinking Water in bbox (overpass QL)":  {
    "overpass": '[out:json];\n(\n  node\n    ["amenity"="drinking_water"]\n    (bbox)\n);\nout body;',
  },
  "Platforms in Bolzano": {
    "overpass": '<osm-script output="json">\n'+
                '  <area-query ref="3600047207"/>\n'+
                '  <recurse type="node-way" />\n'+
                '  <query type="way">\n'+
                '    <item />\n'+
                '    <has-kv k="highway" v="platform"/>\n'+
                '  </query>\n'+
                '  <union>\n'+
                '    <item />\n'+
                '    <recurse type="down" />\n'+
                '  </union>\n'+
                '  <print mode="body" order="quadtile"/>\n'+
                '</osm-script>',
  },
  "Turn Restrictions in bbox": {
    "overpass": '<osm-script output="json">\n  <union into="r">\n    <query type="relation">\n      <bbox-query/>\n      <has-kv k="type" v="restriction"/>\n    </query>\n  </union>\n  <union>\n    <item set="r" />\n    <recurse type="relation-node" />\n  </union>\n  <query type="node">\n    <item />\n  </query>\n  <union>\n    <item />\n    <item set="r" />\n  </union>\n  <print mode="body" order="quadtile"/>\n</osm-script>',
  },
  "find and show ways with Straße misspelled": {
    "overpass": '<osm-script output="json">\n  <query type="way">\n    <has-kv k="highway"/>\n    <has-kv k="name" regv="[Ss]trasse"/>\n    <bbox-query/>\n  </query>\n  <union>\n    <item />\n    <recurse type="down" />\n  </union>\n  <print mode="body" order="quadtile"/>\n</osm-script>',
  },
  "scripting example": {
    "overpass": '<osm-script output="json">\n  <query type="way">\n    <has-kv k="highway"/>\n    <has-kv k="name"/>\n    <bbox-query/>\n  </query>\n  <print mode="body" order="quadtile"/>\n</osm-script>',
    "js": 'var count = 0;\nvar highway = {\n  "mot":0,\n  "tru":0,\n  "pri":0,\n  "sec":0,\n  "ter":0,\n  "unc":0,\n  "res":0,\n  "ped":0,\n  "foo":0,\n  "cyc":0,\n  "pat":0,\n  "oth":0,\n};\n\nfor (var i=0; i<data.elements.length; i++) {\n  count++;\n  switch (data.elements[i].tags["highway"]) {\n    case "motorway":\n    case "motorway_link":\n      highway["mot"]++; \n      break;\n    case "trunk":\n    case "trunk_link":\n      highway["tru"]++; \n      break;\n    case "primary":\n    case "primary_link":\n      highway["pri"]++; \n      break;\n    case "secondary":\n    case "secondary_link":\n      highway["sec"]++; \n      break;\n    case "tertiary":\n    case "tertiary_link":\n      highway["ter"]++; \n      break;\n    case "unclassified":\n      highway["unc"]++; \n      break;\n    case "residential":\n      highway["res"]++; \n      break;\n    case "pedestrian":\n      highway["ped"]++; \n      break;\n    case "footway":\n      highway["foo"]++; \n      break;\n    case "cycleway":\n      highway["cyc"]++; \n      break;\n    case "path":\n      highway["pat"]++; \n      break;\n    default:\n      highway["oth"]++; \n  }\n}\n\nide.log("- - - - -");\nfor (t in highway) {\n  ide.log(t+": "+\n    Math.round(highway[t]*100/count*10)/10+"%");\n}',
  },
  "coord-query (get areas)": {
    "overpass": '<osm-script output="json">\n  <coord-query/>\n  <print/>\n</osm-script>',
  },
}
examples_initial_example = "Drinking Water in bbox";
