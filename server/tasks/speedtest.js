const speedTest = require('speedtest-net');
const tests = require('../controller/speedtests');
const config = require('../controller/config');
const recommendations = require("../controller/recommendations");

let isRunning = false;

function roundSpeed(bytes, elapsed) {
    return Math.round((bytes * 8 / elapsed) / 10) / 100;
}

async function createRecommendations() {
    let list = tests.list();
    if (list.length >= 10) {
        let avgNumbers = {ping: 0, down: 0, up: 0};
        for (let i = 0; i < 10; i++) {
            avgNumbers["ping"] += list[i].ping;
            avgNumbers["down"] += list[i].download;
            avgNumbers["up"] += list[i].upload;
        }

        recommendations.set(avgNumbers["ping"] / 10, avgNumbers["down"] / 10, avgNumbers["up"] / 10);
    }
}

module.exports.run = async () => {
    isRunning = true;
    let serverId = config.get("serverId").value;
    if (serverId === "none")
        serverId = undefined;

    let speedtest = await speedTest({acceptLicense: true, acceptGdpr: true, serverId: serverId});

    if (serverId === undefined)
        config.update("serverId", speedtest.server.id);

    return speedtest;
}

module.exports.create = async () => {
    if (isRunning) return 500;

    try {
        let test = await this.run();
        let ping = Math.round(test.ping.latency);
        let download = roundSpeed(test.download.bytes, test.download.elapsed);
        let upload = roundSpeed(test.upload.bytes, test.upload.elapsed);
        let testResult = tests.create(ping, download, upload);
        console.log(`Test #${testResult} was executed successfully. 🏓 ${ping} ⬇ ${download}️ ⬆ ${upload}️`);
        createRecommendations().then(() => "");
    } catch (e) {
        let testResult = tests.create(0, 0, 0);
        console.log(`Test #${testResult} was not executed successfully. Please try reconnecting to the internet or restarting the software.`);
    }
    isRunning = false;
}

module.exports.removeOld = () => {
    tests.removeOld();
}