"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var fixtures = [
    { name: 'shower', flow: [6000, 12000], typical: [6, 8, 19, 21] }, // ml/min, morning/evening
    { name: 'toilet', flow: [4000, 7000], typical: [0, 23] }, // any hour
    { name: 'kitchen_sink', flow: [1000, 4000], typical: [7, 9, 12, 14, 18, 20] },
    { name: 'washing_machine', flow: [10000, 15000], typical: [10, 16, 20] },
    { name: 'dishwasher', flow: [8000, 12000], typical: [13, 21] },
    { name: 'bath', flow: [8000, 15000], typical: [20] },
    { name: 'garden_hose', flow: [8000, 20000], typical: [7, 18] },
    { name: 'none', flow: [0, 0], typical: [] }, // for no use
];
var startDate = new Date();
startDate.setHours(0, 0, 0, 0);
startDate.setMonth(startDate.getMonth() - 1); // previous month
startDate.setDate(1);
var intervals = 31 * 24 * 60 * 6; // 31 days, 10s intervals
var outputPath = path.join(__dirname, 'sample_water_data.csv');
var header = 'timestamp,flowrate,categorisation\n';
fs.writeFileSync(outputPath, header);
for (var i = 0; i < intervals; i++) {
    var timestamp = new Date(startDate.getTime() + i * 10000);
    var hour = timestamp.getHours();
    var minute = timestamp.getMinutes();
    // Simulate probability of fixture use by time of day
    var fixture = fixtures[fixtures.length - 1]; // default to none
    var rand = Math.random();
    if (hour >= 6 && hour <= 8 && rand < 0.09)
        fixture = fixtures[0]; // shower
    else if (rand < 0.05)
        fixture = fixtures[1]; // toilet
    else if ((hour >= 7 && hour <= 9 || hour >= 18 && hour <= 20) && rand < 0.04)
        fixture = fixtures[2]; // kitchen_sink
    else if ((hour === 10 || hour === 16 || hour === 20) && rand < 0.02)
        fixture = fixtures[3]; // washing_machine
    else if ((hour === 13 || hour === 21) && rand < 0.01)
        fixture = fixtures[4]; // dishwasher
    else if (hour === 20 && rand < 0.01)
        fixture = fixtures[5]; // bath
    else if ((hour === 7 || hour === 18) && rand < 0.01)
        fixture = fixtures[6]; // garden_hose
    // If none, flowrate is 0
    var flowrate = 0;
    if (fixture.name !== 'none') {
        // Random flowrate in range, scaled to 10s interval
        flowrate = Math.round((fixture.flow[0] + Math.random() * (fixture.flow[1] - fixture.flow[0])) / 6);
    }
    var row = "".concat(timestamp.toISOString(), ",").concat(flowrate, ",").concat(fixture.name, "\n");
    fs.appendFileSync(outputPath, row);
}
console.log('Sample CSV generated:', outputPath);
