import { DeviceExtension, IDeviceConfig, IStateChange } from 'smart-hut';
export interface IMqttDeviceConfig extends IDeviceConfig {
    Topic: {
        [key: string]: string;
    };
}
export declare class MqttDeviceExtension extends DeviceExtension {
    Configure(config: any): void;
    OnPropertyChanged(eventArgs: IStateChange): void;
}
