"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MqttExtension = void 0;
const mqtt_1 = __importDefault(require("mqtt"));
const rxjs_1 = require("rxjs");
class MqttExtension {
    static Setup(config) {
        console.log("Setup mqtt extension");
        MqttExtension.Configuration = config;
        return MqttExtension.Connect(MqttExtension.Configuration.Host);
    }
    static Connect(host) {
        return new Promise((resolve, reject) => {
            let client = mqtt_1.default.connect(`mqtt://${host}:1883`, {
                clientId: `mqtt_${Math.random().toString(16).slice(3)}`,
                clean: true,
                connectTimeout: 4000,
                reconnectPeriod: 1000,
            });
            client.on('connect', () => {
                MqttExtension.Client = client;
                MqttExtension.Client.on("message", (topic, payload) => {
                    var _a;
                    if (!MqttExtension.Subscriptions.has(topic))
                        return;
                    (_a = MqttExtension.Subscriptions.get(topic)) === null || _a === void 0 ? void 0 : _a.forEach(element => {
                        element.next({ topic: topic, payload: JSON.parse(payload.toString()) });
                    });
                });
                resolve(MqttExtension.Client);
            });
            client.on('error', (error) => {
                reject(error);
            });
        });
    }
    static Subscribe(topic) {
        MqttExtension.Client.subscribe(topic);
        return new rxjs_1.Observable(subscriber => {
            var _a;
            if (!this.Subscriptions.has(topic)) {
                this.Subscriptions.set(topic, []);
            }
            (_a = this.Subscriptions.get(topic)) === null || _a === void 0 ? void 0 : _a.push(subscriber);
        });
    }
    static Publish(topic, data) {
        MqttExtension.Client.publish(topic, JSON.stringify(data));
    }
}
exports.MqttExtension = MqttExtension;
MqttExtension.Subscriptions = new Map();
