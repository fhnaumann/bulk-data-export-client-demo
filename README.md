# Usage

```
docker build --build-arg VITE_BACKEND_URL=<fhir_server> -t bulk-data-export-client-demo:latest .
helm install my-client ./helm/bulk-data-export-client
```
