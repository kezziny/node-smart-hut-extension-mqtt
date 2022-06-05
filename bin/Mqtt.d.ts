import { Device, DeviceExtension, IDeviceConfig, PropertyChangeEventArgs } from '@kezziny/smart-hut';
export interface IMqttDeviceConfig extends IDeviceConfig {
    Topic: {
        [key: string]: string;
    };
}
export declare class Mqtt extends DeviceExtension {
    private static readonly BindKey;
    private static readonly PublishKey;
    private static readonly ControlKey;
    Configure(config: any): void;
    OnPropertyChanged(eventArgs: PropertyChangeEventArgs): void;
    static Extension<T extends {
        new (...args: any[]): Device;
    }>(constructor: T): {
        new (...args: any[]): {
            Extensions: DeviceExtension[];
            Configuration: IDeviceConfig;
            Configure(config: IDeviceConfig): void;
            GetMethodsWithMetadata(key: string): import("@kezziny/reflection").IMethodInfo[];
            ExecuteCallback(callback: any, ...args: any[]): void;
            GetProperties(): string[];
            GetMethods(): string[];
            HasClassMetadata(key: string): any;
            GetClassMetadata(key: string): any;
            HasPropertyMetadata(property: string, key: string): any;
            GetPropertyMetadata(property: string, key: string): any;
            GetPropertiesWithMetadata(key: string): import("@kezziny/reflection").IMethodInfo[];
            CallMethodsWithMetadata(key: string, ...args: any[]): void;
        };
    } & T;
    static Bind(args: {
        Key: string;
        Topic?: string;
        Converter?: (topic: string, data: any) => any | string;
    }): (device: Device, property: string) => void;
    static Publish(device: Device, property: string): void;
    static Control(callback: (device: Device, data: any) => void | string): (device: Device, property: string) => void;
}
