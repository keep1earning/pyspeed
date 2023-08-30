pip install -r requirements.txt
pyinstaller --noupx --onefile --add-data "templates;templates" --add-data "static;static" app.py