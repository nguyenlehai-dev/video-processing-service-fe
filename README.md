# Video Processing Service FE

Frontend quản trị cho hệ thống xử lý video.

## Source Of Truth

Repo này là **source gốc duy nhất** để phát triển frontend:

- chỉnh code tại `/home/vpsroot/projects/frontend/video-processing-service-fe`
- không chỉnh tay trong:
  - `/home/vpsroot/projects/frontend/video-processing-service-fe-staging`
  - `/home/vpsroot/projects/frontend/video-processing-service-fe-prod`

Hai thư mục `-staging` và `-prod` chỉ là checkout deploy theo branch tương ứng.

## Branch Release Flow

- `dev`: nhánh phát triển
- `staging`: deploy lên `https://test.plxeditor.com/`
- `prod`: deploy lên `https://plxeditor.com/login`

Flow chuẩn:

- `dev -> staging -> prod`
- `staging -> test -> promote -> prod`

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Runtime Config

- `Dockerfile`: image runtime cho production
- `Dockerfile.staging`: image runtime cho staging
- `nginx.conf`: proxy frontend production
- `nginx.staging.conf`: proxy frontend staging sang backend `video-api-staging`

## Deployment Docs

- [Deployment Flow](/home/vpsroot/projects/frontend/video-processing-service-fe/docs/deployment/DEPLOYMENT_FLOW.md)
- [Backend Staging + Prod Setup](/home/vpsroot/projects/backend/video-processing-service/docs/staging-prod-setup.md)
