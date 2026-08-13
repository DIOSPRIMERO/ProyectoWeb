

**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

## Comandos

```bash
cd ruta/a/ProyectoWeb
git checkout main
git pull

git checkout -b entrega-final

# copie el contenido de esta carpeta a la raíz del repositorio
cp -R ~/Downloads/proyecto/. .

# revise que NO aparezca ningún .env ni node_modules
git status

git add .
git commit -m "Entrega final: backend Express con MySQL, RBAC, 2FA y pruebas"
git push -u origin entrega-final
```

## Después de subir

Entre a la pestaña **Actions** de su repositorio en GitHub. El pipeline arranca
solo: levanta un MySQL temporal, corre el linter y las 67 pruebas. Debería ver
dos trabajos en verde (`backend` y `frontend`). Tómele una captura para el
informe: esa es la evidencia de integración continua que pide la consigna.

## Antes de entregar, revise

- [ ] `git status` no muestra `.env` ni `node_modules`
- [ ] El pipeline de Actions está en verde
- [ ] `docker start mysql-produccion` y los pasos del README funcionan
- [ ] Puede entrar con las cuatro cuentas de prueba
- [ ] Como estudiante, no aparecen el dashboard ni los mantenimientos
- [ ] El enlace del repositorio quedó subido a Moodle



docker exec -it mysql-produccion mysql -uroot -proot produccion_academica

SHOW TABLES;
DESCRIBE producciones;
SELECT COUNT(*) FROM producciones;
SELECT titulo, anio FROM producciones WHERE anio = 2023 LIMIT 5;
