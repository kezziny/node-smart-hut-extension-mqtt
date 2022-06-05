"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bind = void 0;
const DeviceExtension_1 = require("./DeviceExtension");
function Bind(args) {
    return function (device, property) {
        if (!device.HasExtension("Mqtt"))
            device.InstallExtension("Mqtt", new DeviceExtension_1.MqttDeviceExtension(device));
        device.DefineMetadata(property, "MqttBind", args);
    };
}
exports.Bind = Bind;
