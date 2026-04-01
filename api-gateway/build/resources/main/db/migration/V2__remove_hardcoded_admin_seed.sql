-- V2: Elimina el admin hardcodeado insertado en V1.
--
-- Problema: V1 insertó admin@sofka.com con el hash BCrypt de "Admin1234!" quemado
-- en el código fuente y en el historial de Git. Cualquier persona con acceso al
-- repositorio conoce esa credencial. El AdminSeeder (Spring Boot) se encarga de
-- crear el admin desde las variables de entorno ADMIN_EMAIL / ADMIN_PASSWORD,
-- que son la única fuente de verdad para las credenciales de administrador.
--
-- Esta migración elimina ese registro estático. El AdminSeeder re-crea el admin
-- con las credenciales correctas en el primer arranque si no existe.

DELETE FROM users WHERE email = 'admin@sofka.com';
