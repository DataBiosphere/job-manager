import { ConfigLoaderService } from "../../environments/config-loader.service";

export class FakeConfigLoaderService extends ConfigLoaderService {
    private testEnvironmentConfig: object = {
        apiUrl : "https://go.to.here.com"
    }

    getEnvironmentConfig(): Promise<any> {
        return Promise.resolve(this.testEnvironmentConfig)
    }

    getEnvironmentConfigSynchronous(): object {
        return this.testEnvironmentConfig
    }
}
