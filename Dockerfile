# =========================================
#  STAGE 1: Build
#  Use a lightweight Node image if you ever
#  add a build step (e.g. minification).
#  For pure static files we go straight to Nginx.
# =========================================
FROM nginx:1.27-alpine AS production

# ---- Labels ----
LABEL maintainer="Dheeraj Choudhary"
LABEL description="Portfolio static website served via Nginx on AWS EKS"
LABEL version="1.0"

# ---- Remove default Nginx static assets ----
RUN rm -rf /usr/share/nginx/html/*

# ---- Copy custom Nginx config ----
COPY nginx.conf /etc/nginx/nginx.conf

# ---- Copy portfolio static files ----
COPY app/ /usr/share/nginx/html/

# ---- Correct ownership & permissions ----
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# ---- Run as non-root for security ----
USER nginx

# ---- Expose port 80 ----
EXPOSE 80

# ---- Health check ----
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# ---- Start Nginx ----
CMD ["nginx", "-g", "daemon off;"]