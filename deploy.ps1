az webapp up --name mpha-tigers-dashboard --resource-group mpha-tigers-rg --runtime "PYTHON:3.13" --os-type Linux --location centralus --plan ASP-mphatigersrg-a303

az webapp config appsettings set --name mpha-tigers-dashboard --resource-group mpha-tigers-rg --settings DB_PASSWORD="Mphcarpediem89!"

Write-Host "Deployment complete and app settings restored!"