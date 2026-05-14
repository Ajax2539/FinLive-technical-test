# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: aaiache <aaiache@student.42.fr>            +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/05/13 12:43:23 by aaiache           #+#    #+#              #
#    Updated: 2026/05/14 14:04:48 by aaiache          ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

COMPOSE = docker compose

all: up

up:
	$(COMPOSE) up --build -d

down:
	$(COMPOSE) down

fclean: down
	$(COMPOSE) down -v
	docker system prune -f

logs:
	$(COMPOSE) logs -f

re: fclean up

.PHONY: all up down logs fclean re