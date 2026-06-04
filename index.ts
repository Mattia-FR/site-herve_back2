import dotenv from "dotenv";

dotenv.config();

import app from "./src/app";
import logger from "./src/config/logger";

const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 4242;

app.get("/", (_req, res) => {
	res.status(200).send(`Je suis sur l'API http://localhost:${port}`);
});

app.listen(port, () => {
	logger.info({ message: "Server started", port });
});
