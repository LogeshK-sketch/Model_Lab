
from flask import Flask, render_template, request, redirect
from pymongo import MongoClient
from bson.objectid import ObjectId

app = Flask(__name__)

# MongoDB Atlas connection
uri = "mongodb+srv://logeshkirubanantham_db_user:mofMHzyWBwbvnTcn@cluster0.fdohfeg.mongodb.net/?appName=Cluster0"
client = MongoClient(uri)

db = client["studentDB"]
students = db["students"]


@app.route("/")
def home():
    all_students = list(students.find())
    return render_template("index.html", students=all_students)


@app.route("/add", methods=["POST"])
def add():
    student = {
        "name": request.form["name"],
        "age": int(request.form["age"]),
        "department": request.form["department"]
    }

    student_id = request.form.get("student_id")

    if student_id:
        students.update_one(
            {"_id": ObjectId(student_id)},
            {"$set": student}
        )
    else:
        students.insert_one(student)

    return redirect("/")


@app.route("/edit/<id>")
def edit(id):
    student = students.find_one({"_id": ObjectId(id)})
    all_students = list(students.find())
    return render_template(
        "index.html",
        students=all_students,
        edit_student=student
    )


@app.route("/delete/<id>")
def delete(id):
    students.delete_one({"_id": ObjectId(id)})
    return redirect("/")


if __name__ == "__main__":
    app.run(debug=True)
