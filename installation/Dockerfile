# Differs a bit from https://github.com/ThePrimeagen/ansible/blob/master/Dockerfile.
FROM ubuntu:lunar
# An ARG is something you can pass at build time, to the builder. You can then use 
# the value in your Dockerfile during the build (but it is no longer available at runtime).
ARG TAGS
WORKDIR /usr/local/bin
# What is this? See docker.md.
ARG DEBIAN_FRONTEND=noninteractive
# RUN apt update &&  \
#     apt-get upgrade -y && \
#     apt-get install -y software-properties-common curl git build-essential && \
#     apt-add-repository -y ppa:ansible/ansible && \
#     apt-get update && \
#     apt-get install -y curl git ansible build-essential && \
#     apt-get clean autoclean && \
#     apt-get autoremove --yes
RUN apt update &&  \
    apt-get upgrade -y && \
    apt-get install -y curl git
#
RUN apt-get install -y software-properties-common
# See six in docker.md
RUN apt-get install -y python3-six
RUN apt-add-repository -y ppa:ansible/ansible
#
RUN apt-get update && \
    apt-get install -y curl git ansible && \
    apt-get clean autoclean && \
    apt-get autoremove --yes

COPY . .
# CMD ["sh", "-c", "ansible-playbook $TAGS local.yml"]