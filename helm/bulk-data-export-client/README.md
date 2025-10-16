# Bulk Data Export Client

A Helm chart for deploying the Bulk Data Export Client Demo application on Kubernetes.

## Introduction

This chart deploys a Vue.js-based web application that provides a user interface for demonstrating FHIR Bulk Data Export functionality. The application is served using nginx and packaged as a containerised application.

## Features

- Stateless web application deployment
- Configurable replica count for high availability
- Health check support with customisable probes
- Resource limits and requests configuration
- Service exposure via ClusterIP (default), NodePort, or LoadBalancer
- Support for node affinity, tolerations, and node selectors
- Rolling update deployment strategy for zero-downtime updates

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- Docker image built and available in your registry

## Installation

### Build the Docker image

First, build the Docker image for the application:

```bash
docker build -t bulk-data-export-client-demo:latest .
```

If you're using a remote registry, tag and push the image:

```bash
docker tag bulk-data-export-client-demo:latest your-registry/bulk-data-export-client-demo:latest
docker push your-registry/bulk-data-export-client-demo:latest
```

### Install the chart

Install the chart with the release name `my-client`:

```bash
helm install my-client ./helm/bulk-data-export-client
```

With custom values:

```bash
helm install my-client ./helm/bulk-data-export-client --values custom-values.yaml
```

With custom image:

```bash
helm install my-client ./helm/bulk-data-export-client \
  --set bulkDataExportClient.image=your-registry/bulk-data-export-client-demo:latest
```

## Configuration

The following table lists the configurable parameters of the Bulk Data Export Client chart and their default values.

| Parameter | Description | Default |
|-----------|-------------|---------|
| `bulkDataExportClient.image` | Container image to use | `bulk-data-export-client-demo:latest` |
| `bulkDataExportClient.imagePullPolicy` | Image pull policy | `IfNotPresent` |
| `bulkDataExportClient.replicas` | Number of replicas to deploy | `1` |
| `bulkDataExportClient.resources` | Resource requests and limits | `{}` |
| `bulkDataExportClient.resources.requests.memory` | Memory request | Not set |
| `bulkDataExportClient.resources.requests.cpu` | CPU request | Not set |
| `bulkDataExportClient.resources.limits.memory` | Memory limit | Not set |
| `bulkDataExportClient.resources.limits.cpu` | CPU limit | Not set |
| `bulkDataExportClient.service.type` | Kubernetes service type | `ClusterIP` |
| `bulkDataExportClient.service.port` | Service port | `80` |
| `bulkDataExportClient.service.targetPort` | Container port | `80` |
| `bulkDataExportClient.healthCheck.enabled` | Enable health check probes | `true` |
| `bulkDataExportClient.healthCheck.path` | Health check endpoint path | `/health` |
| `bulkDataExportClient.healthCheck.initialDelaySeconds` | Initial delay before probes start | `10` |
| `bulkDataExportClient.healthCheck.periodSeconds` | Probe frequency | `10` |
| `bulkDataExportClient.healthCheck.timeoutSeconds` | Probe timeout | `3` |
| `bulkDataExportClient.healthCheck.failureThreshold` | Failed probes before marking unhealthy | `3` |
| `bulkDataExportClient.nodeSelector` | Node labels for pod assignment | `{}` |
| `bulkDataExportClient.tolerations` | Tolerations for pod assignment | `[]` |
| `bulkDataExportClient.affinity` | Affinity rules for pod assignment | `{}` |

## Examples

### Basic deployment with default settings

```bash
helm install my-client ./helm/bulk-data-export-client
```

### Deployment with resource limits

Create a file named `values-with-resources.yaml`:

```yaml
bulkDataExportClient:
  replicas: 2
  resources:
    requests:
      memory: "128Mi"
      cpu: "100m"
    limits:
      memory: "256Mi"
      cpu: "200m"
```

Install with custom values:

```bash
helm install my-client ./helm/bulk-data-export-client --values values-with-resources.yaml
```

### Deployment with NodePort service

```bash
helm install my-client ./helm/bulk-data-export-client \
  --set bulkDataExportClient.service.type=NodePort
```

### Deployment with custom image and registry

```bash
helm install my-client ./helm/bulk-data-export-client \
  --set bulkDataExportClient.image=registry.example.com/bulk-data-export-client-demo:v1.0.0
```

### Deployment with node selector

Create a file named `values-with-node-selector.yaml`:

```yaml
bulkDataExportClient:
  nodeSelector:
    disktype: ssd
    environment: production
```

Install:

```bash
helm install my-client ./helm/bulk-data-export-client --values values-with-node-selector.yaml
```

### Deployment with tolerations

Create a file named `values-with-tolerations.yaml`:

```yaml
bulkDataExportClient:
  tolerations:
    - key: "dedicated"
      operator: "Equal"
      value: "web"
      effect: "NoSchedule"
```

Install:

```bash
helm install my-client ./helm/bulk-data-export-client --values values-with-tolerations.yaml
```

### High availability deployment

Create a file named `values-ha.yaml`:

```yaml
bulkDataExportClient:
  replicas: 3
  resources:
    requests:
      memory: "128Mi"
      cpu: "100m"
    limits:
      memory: "256Mi"
      cpu: "200m"
  affinity:
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            labelSelector:
              matchExpressions:
                - key: app
                  operator: In
                  values:
                    - my-client
            topologyKey: kubernetes.io/hostname
```

Install:

```bash
helm install my-client ./helm/bulk-data-export-client --values values-ha.yaml
```

## Accessing the application

After installation, you can access the application based on the service type:

### ClusterIP (default)

Use port-forwarding to access the application:

```bash
kubectl port-forward service/my-client-service 8080:80
```

Then access at http://localhost:8080

### NodePort

Get the node port:

```bash
export NODE_PORT=$(kubectl get --namespace default -o jsonpath="{.spec.ports[0].nodePort}" services my-client-service)
export NODE_IP=$(kubectl get nodes --namespace default -o jsonpath="{.items[0].status.addresses[0].address}")
echo "http://$NODE_IP:$NODE_PORT"
```

### LoadBalancer

Get the external IP:

```bash
export SERVICE_IP=$(kubectl get svc --namespace default my-client-service --template "{{ range (index .status.loadBalancer.ingress 0) }}{{.}}{{ end }}")
echo "http://$SERVICE_IP:80"
```

## Upgrading

To upgrade an existing release:

```bash
helm upgrade my-client ./helm/bulk-data-export-client
```

With new values:

```bash
helm upgrade my-client ./helm/bulk-data-export-client --values new-values.yaml
```

## Uninstalling

To uninstall the chart:

```bash
helm uninstall my-client
```

This removes all Kubernetes resources associated with the chart and deletes the release.

## Validation

After installation, verify the deployment:

```bash
# Check deployment status
kubectl get deployment my-client-deployment

# Check pod status
kubectl get pods -l app=my-client

# Check service
kubectl get service my-client-service

# View logs
kubectl logs -l app=my-client

# Test health endpoint
kubectl port-forward service/my-client-service 8080:80
curl http://localhost:8080/health
```

## Troubleshooting

### Pods not starting

Check pod events:

```bash
kubectl describe pod -l app=my-client
```

Common issues:
- Image pull failures: Verify the image name and registry credentials
- Resource constraints: Check if nodes have sufficient resources
- Health check failures: Verify the health check endpoint is responding

### Service not accessible

Check service and endpoints:

```bash
kubectl get service my-client-service
kubectl get endpoints my-client-service
```

Verify pods are ready:

```bash
kubectl get pods -l app=my-client
```
