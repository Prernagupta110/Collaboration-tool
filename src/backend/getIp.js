const os = require('os');


function getLocalIpAddress() {
    // This should work?
    // Preliminary testing suggests that
    // not all network interfaces are accessible,
    // which is weird. Ask TA in ex. session?
    const ifaces = os.networkInterfaces();
    let retIP = null

    for (const ifaceName of Object.keys(ifaces)) {
        for (const iface of ifaces[ifaceName]) {
            // console.log(iface);
            if (iface.family === 'IPv4' && !iface.internal) {
                // console.log(iface);
                retIP = iface.address;
                if (retIP.startsWith("192.168")) return retIP;
            }
        }
    }

    return retIP;
}

module.exports = getLocalIpAddress
