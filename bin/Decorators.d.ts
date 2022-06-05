import { MqttDeviceExtension } from './DeviceExtension';
import { Device } from 'smart-hut';
interface IBindArguments {
    Source?: {
        Key: string;
        Topic?: string;
        Converter?: (topic: string, data: any) => any;
    };
    Publish?: {
        Name?: string;
    };
    Control?: {
        Callback: (context: MqttDeviceExtension, data: any) => any;
    };
}
export declare function Bind(args: IBindArguments): (device: Device, property: string) => void;
export {};
