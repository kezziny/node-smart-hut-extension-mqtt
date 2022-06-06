import mqtt from 'mqtt';
import { Observable, Subscriber } from "rxjs";

export interface MqttPackage
{
    topic: string;
    payload: any;
}

export interface IMqttConfig {
    Host: string;
    SourceRootTopic: string;
    TargetRootTopic: string;
}

export class MqttExtension
{
    public static Configuration: IMqttConfig;

    public static Setup(config: IMqttConfig): Promise<MqttExtension> {
        console.log("Setup mqtt extension");
        
        MqttExtension.Configuration = config;
        return MqttExtension.Connect(MqttExtension.Configuration.Host);
    }

    private static Client:any;
    private static Subscriptions:Map<string, Subscriber<MqttPackage>[]> = new Map<string, Subscriber<MqttPackage>[]>();

    private static Connect(host: string) : Promise<MqttExtension>
    {
        return new Promise<MqttExtension>((resolve, reject) => {
            let client = mqtt.connect(`mqtt://${host}:1883`, {
                        clientId: `mqtt_${Math.random().toString(16).slice(3)}`,
                        clean: true,
                        connectTimeout: 4000,
                        reconnectPeriod: 1000,
                    });
            client.on('connect', () => {
                MqttExtension.Client = client;
                MqttExtension.Client.on("message", (topic:string, payload:any) => {
                    if (!MqttExtension.Subscriptions.has(topic)) return;
        
                    MqttExtension.Subscriptions.get(topic)?.forEach(element => {
                        element.next({topic: topic, payload: JSON.parse(payload.toString())});
                    });
                });
                resolve(MqttExtension.Client);
            });
            client.on('error', (error:any) => {
                reject(error);
            });
        });
    }

    public static Subscribe(topic:string) : Observable<MqttPackage>
    {
        MqttExtension.Client.subscribe(topic);
        return new Observable<MqttPackage>( subscriber => {
            if (!this.Subscriptions.has(topic)) {
                this.Subscriptions.set(topic, []);
            }

            this.Subscriptions.get(topic)?.push(subscriber);
        });
    }

    public static Publish(topic: string, data: any): void
    {
        MqttExtension.Client.publish(topic, JSON.stringify(data));
    }
}