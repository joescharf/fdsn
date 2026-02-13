FROM alpine:3.21
RUN apk add --no-cache ca-certificates tzdata
RUN addgroup -S fdsn && adduser -S fdsn -G fdsn
RUN mkdir -p /data && chown fdsn:fdsn /data
ARG TARGETOS
ARG TARGETARCH
COPY ${TARGETOS}/${TARGETARCH}/fdsn /usr/local/bin/fdsn
USER fdsn
ENV FDSN_DB_PATH=/data/fdsn.db
EXPOSE 8080
ENTRYPOINT ["fdsn"]
CMD ["serve"]
