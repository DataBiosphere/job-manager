/**
 * Job Manager Service
 * Job Manager API for interacting with asynchronous batch jobs and workflows.
 *
 * OpenAPI spec version: 0.0.1
 * 
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */

import * as models from './models';

/**
 * Failure messages
 */
export interface FailureMessage {
    /**
     * The failure message
     */
    failure: string;

    /**
     * The time at which this failure occurred
     */
    timestamp?: Date;

}
