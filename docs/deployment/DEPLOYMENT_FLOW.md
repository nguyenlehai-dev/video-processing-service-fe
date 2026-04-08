# Video Processing Service FE Deployment Flow

## Domain Mapping

- `staging` branch -> `https://test.plxeditor.com/`
- `prod` branch -> `https://plxeditor.com/login`

Production user entrypoint:

- `https://plxeditor.com/login`

## Source Model

- Chỉ có **1 source gốc** để phát triển:
  - `/home/vpsroot/projects/frontend/video-processing-service-fe`
- Các thư mục deploy:
  - `/home/vpsroot/projects/frontend/video-processing-service-fe-staging`
  - `/home/vpsroot/projects/frontend/video-processing-service-fe-prod`
  chỉ là worktree/checkouts để chạy môi trường, không phải nơi chỉnh code.

## Release Flow

1. Develop trên `dev`
2. Promote `dev -> staging`
3. Deploy `staging` lên `test.plxeditor.com`
4. Validate trên test
5. Promote `staging -> prod`
6. Deploy `prod` lên `plxeditor.com`

Short form:

- `dev -> staging -> test -> promote -> prod`

## Runtime Config

- `staging` dùng `Dockerfile.staging`
- `staging` dùng `nginx.staging.conf`
- `prod` dùng `Dockerfile`
- `prod` dùng `nginx.conf`

## Rules

- Không sửa trực tiếp trong các thư mục `-staging` và `-prod`
- Không copy source bằng tay giữa các môi trường
- Promote chỉ qua branch và git history
