# AWS EKS Portfolio Project

> A production-grade static portfolio website deployed on **AWS EKS** using Docker, Amazon ECR, Kubernetes, and AWS ALB Ingress Controller.

![AWS](https://img.shields.io/badge/AWS-EKS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Nginx-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-1.34-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)
![ECR](https://img.shields.io/badge/Amazon-ECR-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)

---

## 📌 Project Overview

This project demonstrates end-to-end deployment of a static portfolio website on AWS EKS. It covers containerization with Docker, image registry management with Amazon ECR, Kubernetes orchestration, and public exposure via AWS Application Load Balancer (ALB).

**Live Stack:**
```
HTML/CSS/JS → Nginx → Docker → Amazon ECR → AWS EKS → AWS ALB → Internet
```

---

## 🏗️ Architecture

```
                        ┌─────────────────────────────────────────┐
                        │              AWS Cloud (us-west-2)       │
                        │                                         │
  User Browser          │   ┌──────────┐      ┌───────────────┐  │
      │                 │   │   ALB    │      │  EKS Cluster  │  │
      │  HTTP:80        │   │(internet │─────▶│               │  │
      └────────────────▶│   │ facing)  │      │ ┌───────────┐ │  │
                        │   └──────────┘      │ │   Pod 1   │ │  │
                        │         ▲           │ │ (Nginx)   │ │  │
                        │         │           │ └───────────┘ │  │
                        │   ┌─────────────┐   │ ┌───────────┐ │  │
                        │   │ ALB Ingress │   │ │   Pod 2   │ │  │
                        │   │ Controller  │   │ │ (Nginx)   │ │  │
                        │   └─────────────┘   │ └───────────┘ │  │
                        │                     └───────────────┘  │
                        │                                         │
                        │   ┌──────────────────────────────────┐  │
                        │   │         Amazon ECR               │  │
                        │   │   portfolio-eks:latest           │  │
                        │   └──────────────────────────────────┘  │
                        └─────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
aws-eks-project-portfolio/
├── app/
│   ├── index.html          # Portfolio HTML
│   ├── style.css           # Styles (Dark theme, AWS Orange accent)
│   └── script.js           # Animations, cursor, counters
├── k8s/
│   ├── deployment.yaml     # Kubernetes Deployment (2 replicas)
│   ├── service.yaml        # ClusterIP Service
│   ├── ingress.yaml        # IngressClass + ALB Ingress
│   ├── alb-controller.yaml # AWS Load Balancer Controller manifests
│   └── iam_policy.json     # IAM Policy for ALB Controller
├── Dockerfile              # Production-grade Nginx Dockerfile
├── nginx.conf              # Custom Nginx configuration
└── README.md               # This file
```

---

## ✅ Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Docker Desktop | 26.x+ | Build & run containers |
| AWS CLI | 2.x+ | Interact with AWS services |
| kubectl | 1.29+ | Manage Kubernetes cluster |
| eksctl | 0.170+ | Create & manage EKS clusters |
| Git Bash | Latest | Run commands on Windows |

### AWS IAM Permissions Required
- AmazonEKSFullAccess
- AmazonEC2FullAccess
- AmazonECRFullAccess
- IAMFullAccess
- AWSLoadBalancerControllerIAMPolicy (created in setup)

---

## 🚀 Step-by-Step Deployment Guide

### Step 1 — Configure AWS CLI

```bash
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-west-2), Output (json)

# Verify
aws sts get-caller-identity
```

### Step 2 — Set Environment Variables

```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-west-2
export ECR_REPO_NAME=portfolio-eks
export CLUSTER_NAME=portfolio-eks-cluster
export IMAGE_TAG=latest
```

### Step 3 — Create ECR Repository & Push Docker Image

```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name $ECR_REPO_NAME \
  --region $AWS_REGION \
  --image-scanning-configuration scanOnPush=true

# Authenticate Docker to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build Docker image
docker build -t $ECR_REPO_NAME:$IMAGE_TAG .

# Test locally (optional)
docker run -d -p 8080:80 --name portfolio-test $ECR_REPO_NAME:$IMAGE_TAG
# Open http://localhost:8080 then:
docker stop portfolio-test && docker rm portfolio-test

# Tag and push to ECR
docker tag $ECR_REPO_NAME:$IMAGE_TAG \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME:$IMAGE_TAG

docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME:$IMAGE_TAG
```

### Step 4 — Create EKS Cluster

> ⏳ This takes 15-20 minutes.

```bash
eksctl create cluster \
  --name $CLUSTER_NAME \
  --region $AWS_REGION \
  --nodegroup-name portfolio-nodes \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 3 \
  --managed \
  --with-oidc \
  --ssh-access=false \
  --full-ecr-access \
  --alb-ingress-access

# Connect kubectl to cluster
aws eks update-kubeconfig --region $AWS_REGION --name $CLUSTER_NAME

# Verify nodes
kubectl get nodes
```

### Step 5 — Install AWS Load Balancer Controller

```bash
# Create IAM Policy
aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://k8s/iam_policy.json

# Create IAM Service Account
eksctl create iamserviceaccount \
  --cluster $CLUSTER_NAME \
  --namespace kube-system \
  --name aws-load-balancer-controller \
  --attach-policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/AWSLoadBalancerControllerIAMPolicy \
  --override-existing-serviceaccounts \
  --approve \
  --region $AWS_REGION

# Generate TLS cert for webhook (Git Bash)
export OPENSSL_CONF=/mingw64/ssl/openssl.cnf
openssl req -x509 -newkey rsa:4096 -keyout tls.key -out tls.crt -days 365 -nodes \
  -subj "//CN=aws-load-balancer-controller-webhook-service.kube-system.svc"

# Create Kubernetes secret from cert
kubectl create secret tls aws-load-balancer-tls \
  --cert=tls.crt \
  --key=tls.key \
  -n kube-system

rm tls.crt tls.key

# Deploy ALB Controller
kubectl apply -f k8s/alb-controller.yaml

# Verify controller is running
kubectl get pods -n kube-system | grep aws-load-balancer
```

### Step 6 — Deploy the Portfolio App

```bash
# Update ECR image URI in deployment.yaml first:
# image: <AWS_ACCOUNT_ID>.dkr.ecr.us-west-2.amazonaws.com/portfolio-eks:latest

# Create namespace and deploy
kubectl create namespace portfolio
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Verify everything is running
kubectl get pods,svc,ingress -n portfolio
```

### Step 7 — Fix Security Group for ALB Access

```bash
# Get the cluster security group
aws ec2 describe-security-groups \
  --filters "Name=tag:aws:eks:cluster-name,Values=$CLUSTER_NAME" \
  --query "SecurityGroups[*].[GroupId,GroupName]" \
  --output table \
  --region $AWS_REGION

# Allow port 80 inbound (replace with your SG ID)
aws ec2 authorize-security-group-ingress \
  --group-id <YOUR_SG_ID> \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region $AWS_REGION
```

### Step 8 — Get ALB URL & Access the App

```bash
# Get the ALB DNS name (wait 3-5 minutes after ingress creation)
kubectl get ingress -n portfolio

# Watch until ADDRESS populates
kubectl get ingress -n portfolio -w
```

Open the `ADDRESS` URL in your browser — your portfolio is live! 🎉

---

## 🐳 Dockerfile Highlights

- Base image: `nginx:1.27-alpine` (minimal attack surface)
- Runs as **non-root** user (`nginx`) for security
- Built-in **HEALTHCHECK** using wget
- Custom `nginx.conf` with gzip, security headers, and caching

---

## ⚙️ Kubernetes Manifests

| File | Kind | Purpose |
|------|------|---------|
| `deployment.yaml` | Deployment | 2 replicas, RollingUpdate, liveness & readiness probes |
| `service.yaml` | Service (ClusterIP) | Internal service routing to pods |
| `ingress.yaml` | IngressClass + Ingress | ALB creation and traffic routing |
| `alb-controller.yaml` | Deployment + RBAC | AWS Load Balancer Controller |
| `iam_policy.json` | IAM Policy | Permissions for ALB Controller |

---

## 🔧 Nginx Configuration Highlights

- Gzip compression for CSS, JS, HTML, JSON, SVG
- Security headers: `X-Frame-Options`, `X-XSS-Protection`, `X-Content-Type-Options`
- 30-day cache for static assets
- ALB health check endpoint at `/health`
- Hidden file blocking (`/.*`)
- `server_tokens off` — hides Nginx version

---

## 💰 Cost Estimate

| Resource | Approx Cost/Day |
|----------|----------------|
| EKS Cluster | ~$0.10/hr (~$2.40/day) |
| 2x t3.medium nodes | ~$0.0416/hr each (~$2.00/day) |
| ALB | ~$0.008/hr (~$0.20/day) |
| ECR Storage | Minimal |
| **Total** | **~$4.60/day** |

---

## 🧹 Cleanup — Delete All Resources

```bash
# Delete Kubernetes resources
kubectl delete namespace portfolio
kubectl delete -f k8s/alb-controller.yaml

# Delete EKS cluster (also deletes nodes and VPC)
eksctl delete cluster --name $CLUSTER_NAME --region $AWS_REGION

# Delete ECR repository
aws ecr delete-repository \
  --repository-name $ECR_REPO_NAME \
  --region $AWS_REGION \
  --force

# Delete IAM policy
aws iam delete-policy \
  --policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/AWSLoadBalancerControllerIAMPolicy
```

---

## 🛠️ Troubleshooting

| Issue | Fix |
|-------|-----|
| ALB ADDRESS empty | Check `kubectl describe ingress -n portfolio` for events |
| 504 Gateway Timeout | Allow port 80 on node security group |
| ALB Controller CrashLoopBackOff | Check TLS secret exists in kube-system |
| Pods not starting | Check `kubectl logs -n portfolio deployment/portfolio-deployment` |
| IngressClass not found | Apply `k8s/ingress.yaml` which includes IngressClass resource |

---

## 👨‍💻 Author

**Dheeraj Choudhary**
AWS Hero | DevOps Expert | Community Leader

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=flat&logo=linkedin)](https://linkedin.com/in/dheerajchoudhary)
[![YouTube](https://img.shields.io/badge/YouTube-Subscribe-FF0000?style=flat&logo=youtube)](https://youtube.com)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=flat&logo=github)](https://github.com/dheerajchoudhary)

---

## ⭐ If this project helped you, give it a star!