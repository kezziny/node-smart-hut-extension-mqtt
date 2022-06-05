import { Observable } from "rxjs";
export interface MqttPackage {
    topic: string;
    payload: any;
}
export interface IMqttConfig {
    Host: string;
    SourceRootTopic: string;
    TargetRootTopic: string;
}
export declare class MqttExtension {
    static Configuration: IMqttConfig;
    static Setup(config: any): Promise<MqttExtension>;
    private static Client;
    private static Subscriptions;
    private static Connect;
    static Subscribe(topic: string): Observable<MqttPackage>;
    static Publish(topic: string, data: any): void;
}
