# Video Processing Service FE Deployment Flow

## Domain Mapping

- `staging` branch -> `https://test.plxeditor.com/`
- `prod` branch -> `https://plxeditor.com/login`

Production user entrypoint:

- `https://plxeditor.com/login`

## Source Model

- Chỉ có **1 source gốc** để phát triển:
  - `/home/vpsroot/projects/frontend/video-processing-service-fe`
- Staging và prod chạy từ Docker image build theo branch, không chạy từ local worktree.

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
- GitHub Actions build/push:
  - `staging` -> `ghcr.io/nguyenlehai-dev/video-processing-service-fe:staging`
  - `prod` -> `ghcr.io/nguyenlehai-dev/video-processing-service-fe:prod`

## Rules

- Không copy source bằng tay giữa các môi trường
- Promote chỉ qua branch và git history
- Deploy server chỉ `pull` image theo tag branch
