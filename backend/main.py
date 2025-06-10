from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from parser import detect_csv_type, parse_stan_csv, parse_stripe_csv

app = FastAPI()

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/upload/")
async def upload_csv(file: UploadFile = File(...)):
    contents = await file.read()
    data = contents.decode("utf-8").splitlines()
    header = data[0]

    csv_type = detect_csv_type(header)

    if csv_type == "stan":
        result = parse_stan_csv(data)
    elif csv_type == "stripe":
        result = parse_stripe_csv(data)
    else:
        return {"error": "Unsupported CSV format."}

    return result
