# Deploy Job Manager against Cromwell with Kubernetes(GKE)

1. Prepare the config files following the instructions, based on your requirements.

2. Make sure your network settings are correct, e.g. DNS, TLS certs.

3. Make sure your Kubernetes cluster is ready.

4. Create the corresponding secret objects and configMap objects with `kubectl create secret generic --from-file` and 
`kubectl create configmap --from-file` commands.

5. Create the ingress with `kubectl apply -f ingress.yaml`.

6. Create the service with `kubectl apply -f service.yaml`.

7. Create the deployment with `kubectl apply -f deployment.yaml`.

8. Check if the health checks is working.