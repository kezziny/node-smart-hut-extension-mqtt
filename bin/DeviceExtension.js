"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MqttDeviceExtension = void 0;
const Extension_1 = require("./Extension");
const smart_hut_1 = require("smart-hut");
class MqttDeviceExtension extends smart_hut_1.DeviceExtension {
    Configure(config) {
        super.Configure(config);
        console.log("Configure device extension: mqtt");
        if (typeof config.Topic === "string") {
            this.Configuration.Topic = { "default": config.Topic };
        }
        let bindings = this.Device.GetAllPropertyWithKey("MqttBind")
            .map(property => {
            return { name: property, metadata: this.Device.GetMetadata(property, "MqttBind") };
        });
        // Subscribe to source topics
        let sourceBindings = bindings.filter(binding => binding.metadata.hasOwnProperty("Source"));
        Object.getOwnPropertyNames(this.Configuration.Topic).forEach(topicName => {
            let topic = this.Configuration.Topic[topicName];
            if (topic[0] === '.')
                topic = Extension_1.MqttExtension.Configuration.SourceRootTopic + topic.substring(1);
            console.log("Subscribe to source topic:", topic);
            Extension_1.MqttExtension.Subscribe(topic).subscribe(packet => {
                sourceBindings.filter(binding => (binding.metadata.Source.Topic || 'default') === topicName)
                    .filter(binding => packet.payload.hasOwnProperty(binding.metadata.Source.Key))
                    .forEach(binding => {
                    let value = packet.payload[binding.metadata.Source.Key];
                    if (binding.metadata.Source.Converter)
                        value = binding.metadata.Source.Converter(topicName, value);
                    console.log("Try override", binding.name, "with", value, "from source", topic);
                    if (value !== null)
                        this.Device[binding.name] = { value: value };
                });
            });
        });
        // Subscribe to control topics
        bindings.filter(binding => binding.metadata.hasOwnProperty("Control"))
            .forEach(binding => {
            console.log("Subscribe to control topic:", `${Extension_1.MqttExtension.Configuration.TargetRootTopic}/${this.Device.Configuration.Room}/${this.Device.Configuration.Name}/set`);
            Extension_1.MqttExtension.Subscribe(`${Extension_1.MqttExtension.Configuration.TargetRootTopic}/${this.Configuration.Room}/${this.Configuration.Name}/${binding.name}/set`)
                .subscribe(packet => {
                binding.metadata.Control.Callback(this, packet.payload);
            });
        });
    }
    OnPropertyChanged(eventArgs) {
        var _a;
        if (this.Device.HasMetadata(eventArgs.Property, "MqttBind")
            && ((_a = this.Device.GetMetadata(eventArgs.Property, "MqttBind")) === null || _a === void 0 ? void 0 : _a.hasOwnProperty("Publish"))) {
            console.log("Publish changed data of", eventArgs.Property, "with value", eventArgs.To);
            Extension_1.MqttExtension.Publish(`${Extension_1.MqttExtension.Configuration.TargetRootTopic}/${this.Configuration.Room}/${this.Configuration.Name}/${eventArgs.Property}`, eventArgs.To);
        }
    }
}
__decorate([
    (0, smart_hut_1.OnPropertyChanged)('Any')
], MqttDeviceExtension.prototype, "OnPropertyChanged", null);
exports.MqttDeviceExtension = MqttDeviceExtension;
