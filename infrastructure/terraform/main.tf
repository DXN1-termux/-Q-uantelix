# [Q]uantelix — Terraform (AWS)
terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 2.0" }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-1"
}

variable "app_name" {
  default = "quantelix"
}

variable "environment" {
  default = "production"
}

# ECS Fargate cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-${var.environment}"
}

# ECR repository
resource "aws_ecr_repository" "app" {
  name = "${var.app_name}-${var.environment}"
}

# RDS Postgres for persistent storage
resource "aws_db_instance" "main" {
  identifier     = "${var.app_name}-${var.environment}"
  engine         = "postgres"
  engine_version = "16"
  instance_class = "db.t3.medium"
  db_name        = "quantelix"
  skip_final_snapshot = true
}

# CloudFront for CDN
resource "aws_cloudfront_distribution" "cdn" {
  origin {
    domain_name = aws_ecs_cluster.main.id
    origin_id   = "quantelix-origin"
  }
  enabled = true
  default_cache_behavior {
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "quantelix-origin"
    forwarded_values {
      query_string = true
      cookies { forward = "all" }
    }
  }
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

output "cloudfront_url" {
  value = aws_cloudfront_distribution.cdn.domain_name
}
