pm2 start server.js --name="Server1" --watch -- 8081
pm2 start server.js --name="Server2" --watch -i max -- 8082   
pm2 start server.js --name="Server3" --watch -i max -- 8083  
pm2 start server.js --name="Server4" --watch -i max -- 8084
pm2 start server.js --name="Server4" --watch -i max -- 8085  