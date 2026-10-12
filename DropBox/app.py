
import os
from io import BytesIO

import dropbox
from dotenv import load_dotenv
from flask import Flask, render_template, request, redirect, url_for, send_file, flash
from werkzeug.utils import secure_filename

load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)

token = os.getenv("DROPBOX_ACCESS_TOKEN")
dbx = dropbox.Dropbox(token)


# HOME: VIEW FILES
@app.route("/")
def home():
    try:
        result = dbx.files_list_folder("")
        files = [
            item for item in result.entries
            if isinstance(item, dropbox.files.FileMetadata)
        ]

        while result.has_more:
            result = dbx.files_list_folder_continue(result.cursor)
            files.extend(
                item for item in result.entries
                if isinstance(item, dropbox.files.FileMetadata)
            )

        return render_template("index.html", files=files)

    except Exception as e:
        return f"Dropbox error: {e}", 500


# UPLOAD FILE
@app.route("/upload", methods=["POST"])
def upload():
    file = request.files.get("file")

    if not file or not file.filename:
        flash("Please select a file.")
        return redirect(url_for("home"))

    filename = secure_filename(file.filename)

    if not filename:
        flash("Invalid filename.")
        return redirect(url_for("home"))

    try:
        dbx.files_upload(
            file.read(),
            "/" + filename,
            mode=dropbox.files.WriteMode.overwrite
        )
        flash("File uploaded successfully!")

    except Exception as e:
        flash(f"Upload failed: {e}")

    return redirect(url_for("home"))


# DOWNLOAD FILE

@app.route("/download/<path:file_path>")
def download(file_path):
    try:
        # Restore the full Dropbox path
        if not file_path.startswith("/"):
            file_path = "/" + file_path

        metadata, response = dbx.files_download(file_path)

        return send_file(
            BytesIO(response.content),
            as_attachment=True,
            download_name=metadata.name
        )

    except Exception as e:
        return f"Download failed: {e}", 500



if __name__ == "__main__":
    if not token:
        raise RuntimeError("Add DROPBOX_ACCESS_TOKEN to your .env file")

    app.run(debug=True)
