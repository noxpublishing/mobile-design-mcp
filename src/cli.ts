#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMobileServer } from './server.js';
const app=createMobileServer();
await app.server.connect(new StdioServerTransport());
let closing=false;
const close=async()=>{if(closing)return;closing=true;await app.close();};
process.once('SIGTERM',()=>{void close();});
process.once('SIGINT',()=>{void close();});
