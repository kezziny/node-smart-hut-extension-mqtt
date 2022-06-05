"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mqtt = void 0;
const reflection_1 = require("reflection");
const smart_hut_1 = require("smart-hut");
const Extension_1 = require("./Extension");
class Mqtt extends smart_hut_1.DeviceExtension {
    Configure(config) {
        super.Configure(config);
        console.log("Configure device extension: mqtt");
        if (typeof config.Topic === "string") {
            this.Configuration.Topic = { "default": config.Topic };
        }
        // Subscribe to source topics
        let sourceBindings = this.Device.GetPropertiesWithMetadata(Mqtt.BindKey);
        Object.getOwnPropertyNames(this.Configuration.Topic).forEach(topicName => {
            let topic = this.Configuration.Topic[topicName];
            if (topic[0] === '.')
                topic = Extension_1.MqttExtension.Configuration.SourceRootTopic + topic.substring(1);
            console.log("Subscribe to source topic:", topic);
            Extension_1.MqttExtension.Subscribe(topic).subscribe(packet => {
                sourceBindings.filter(binding => (binding.Metadata.Topic || 'default') === topicName)
                    .filter(binding => packet.payload.hasOwnProperty(binding.Metadata.Key))
                    .forEach(binding => {
                    let value = packet.payload[binding.Metadata.Key];
                    if (binding.Metadata.Converter)
                        value = binding.Metadata.Converter(topicName, value);
                    console.log("Try override", binding.Name, "with", value, "from source", topic);
                    this.Device[binding.Name].Value = { value: value };
                });
            });
        });
        // Subscribe to control topics
        this.Device.GetPropertiesWithMetadata(Mqtt.ControlKey)
            .forEach(property => {
            console.log("Subscribe to control topic:", `${Extension_1.MqttExtension.Configuration.TargetRootTopic}/${this.Device.Configuration.Room}/${this.Device.Configuration.Name}/${property.Name}/set`);
            Extension_1.MqttExtension.Subscribe(`${Extension_1.MqttExtension.Configuration.TargetRootTopic}/${this.Configuration.Room}/${this.Configuration.Name}/${property.Name}/set`)
                .subscribe(packet => {
                this.Device.ExecuteCallback(property.Metadata, packet.payload);
            });
        });
    }
    OnPropertyChanged(eventArgs) {
        console.log("Has mqtt publish key?", eventArgs.Property);
        if (this.Device.HasPropertyMetadata(eventArgs.Property, Mqtt.PublishKey)) {
            console.log("Publish changed data of", eventArgs.Property, "with value", eventArgs.To);
            Extension_1.MqttExtension.Publish(`${Extension_1.MqttExtension.Configuration.TargetRootTopic}/${this.Configuration.Room}/${this.Configuration.Name}/${eventArgs.Property}`, eventArgs.To);
        }
    }
    static Extension(constructor) {
        return class extends constructor {
            constructor(...args) {
                super(args);
                this.Extensions.push(new Mqtt(this));
            }
        };
    }
    static Bind(args) {
        return function (device, property) {
            reflection_1.Reflection.SetPropertyMetadata(device, property, Mqtt.BindKey, args);
        };
    }
    static Publish(device, property) {
        reflection_1.Reflection.SetPropertyMetadata(device, property, Mqtt.PublishKey, null);
    }
    static Control(callback) {
        return function (device, property) {
            reflection_1.Reflection.SetPropertyMetadata(device, property, Mqtt.ControlKey, callback);
        };
    }
}
Mqtt.BindKey = "Bind";
Mqtt.PublishKey = "Publish";
Mqtt.ControlKey = "Control";
__decorate([
    smart_hut_1.Property.OnChanged('Any')
], Mqtt.prototype, "OnPropertyChanged", null);
exports.Mqtt = Mqtt;
