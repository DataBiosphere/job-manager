# Deploy Job Manager against Cromwell with Kubernetes(GKE)

1. Prepare the config files following the [main instructions](../../README.md), based on your requirements.

2. Make sure your network settings are correct, e.g. DNS, TLS certs.

3. Make sure your Kubernetes cluster is ready.

4. Make sure you are in the same directory of where the kubernetes config files are hosted.

5. Create the corresponding secret objects and configMap objects with `kubectl create secret generic --from-file` and 
`kubectl create configmap --from-file` commands.

6. Create the ingress with `kubectl apply -f ingress.yaml`.

7. Create the service with `kubectl apply -f service.yaml`.

8. Create the deployment with `kubectl apply -f deployment.yaml`.

9. Check if the health checks is working.
