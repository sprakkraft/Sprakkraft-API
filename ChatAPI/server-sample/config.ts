
export class Config {
  serverPort: string = process.env.PORT || '3102';
  mongodbUri: string = process.env.MONGO_URI || 'mongodb://localhost/chat';
  log: boolean = process.env.LOG ? String(process.env.LOG).toLowerCase() == 'true' :  false;
}
