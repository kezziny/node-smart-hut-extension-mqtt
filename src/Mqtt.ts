import { Reflection } from 'reflection';
import { Device, DeviceExtension, IDeviceConfig, Property, PropertyChangeEventArgs } from 'smart-hut';
import { MqttExtension } from './Extension';

export interface IMqttDeviceConfig extends IDeviceConfig {
	Topic: {[key: string]: string};
}

export class Mqtt extends DeviceExtension {
	private static readonly BindKey = "Bind";
	private static readonly PublishKey = "Publish";
	private static readonly ControlKey = "Control";

	public override Configure(config: any) {
		super.Configure(config);
		console.log("Configure device extension: mqtt");

		if (typeof config.Topic === "string") {
			this.Configuration.Topic = { "default": config.Topic };
		}


		// Subscribe to source topics
		let sourceBindings = this.Device.GetPropertiesWithMetadata(Mqtt.BindKey);

		Object.getOwnPropertyNames(this.Configuration.Topic).forEach(topicName => {
			let topic: string = this.Configuration.Topic[topicName];
			if (topic[0] === '.') topic = MqttExtension.Configuration.SourceRootTopic + topic.substring(1);

			console.log("Subscribe to source topic:", topic);
			MqttExtension.Subscribe(topic).subscribe(packet => {
				sourceBindings.filter(binding => (binding.Metadata.Topic || 'default') === topicName)
					.filter(binding => packet.payload.hasOwnProperty(binding.Metadata.Key))
					.forEach(binding => {
						let value = packet.payload[binding.Metadata.Key];
						if (binding.Metadata.Converter) value = binding.Metadata.Converter(topicName, value);
						console.log("Try override", binding.Name, "with", value, "from source", topic);
						this.Device[binding.Name].Value = { value: value };
					});
			})
		});

		// Subscribe to control topics
		this.Device.GetPropertiesWithMetadata(Mqtt.ControlKey)
			.forEach( property => {
				console.log("Subscribe to control topic:", `${MqttExtension.Configuration.TargetRootTopic}/${this.Device.Configuration.Room}/${this.Device.Configuration.Name}/${property.Name}/set`);
				MqttExtension.Subscribe(`${MqttExtension.Configuration.TargetRootTopic}/${this.Configuration.Room}/${this.Configuration.Name}/${property.Name}/set`)
					.subscribe(packet =>{
						this.Device.ExecuteCallback(property.Metadata, packet.payload);
					});
			});

	}

	@Property.OnChanged('Any')
	public OnPropertyChanged(eventArgs: PropertyChangeEventArgs) {
		console.log("Has mqtt publish key?", eventArgs.Property);
		if (this.Device.HasPropertyMetadata(eventArgs.Property, Mqtt.PublishKey)) {
			console.log("Publish changed data of", eventArgs.Property, "with value", eventArgs.To);
			MqttExtension.Publish(`${MqttExtension.Configuration.TargetRootTopic}/${this.Configuration.Room}/${this.Configuration.Name}/${eventArgs.Property}`, eventArgs.To);
		}
	}



	public static Extension<T extends { new (...args: any[]): Device }>(constructor: T) {
		return class extends constructor {
			constructor(...args:any[]) {
				super(args);
				this.Extensions.push(new Mqtt(this));
			}
		};
	}

	public static Bind(args: { Key: string, Topic?: string, Converter?: (topic: string, data: any) => any | string}) {
		return function (device: Device, property: string) {
			Reflection.SetPropertyMetadata(device, property, Mqtt.BindKey, args);
		}
	}
	public static Publish(device: Device, property: string) {
		Reflection.SetPropertyMetadata(device, property, Mqtt.PublishKey, null);
	}

	public static Control(callback: (device: Device, data: any) => void | string) {
		return function (device: Device, property: string) {
			Reflection.SetPropertyMetadata(device, property, Mqtt.ControlKey, callback);
		}
	}
}