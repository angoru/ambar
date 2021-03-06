import http from 'http'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import api from './api'
import config from './config'
import cluster from 'cluster'

import 'babel-core/register'
import 'idempotent-babel-polyfill'

import { FileWatchService, ApiProxy } from './services'

let app = null
if (cluster.isMaster) {
	ApiProxy.logData(config.name, 'info', 'API runs on master thread')
	ApiProxy.logData(config.name, 'info', 'Creating fork for the file-watcher process')
	cluster.fork()

	app = express()
	app.server = http.createServer(app)

	app.use(cors({
		credentials: true,
		origin: true
	}))

	app.use(bodyParser.json({
		limit: config.bodyLimit
	}))

	// api router
	app.use('/api', api())
	app.server.listen(process.env.PORT || config.port)

	console.log(`Started API on ${app.server.address().address}:${app.server.address().port}`)
	
	
} else {
	ApiProxy.logData(config.name, 'info', 'File-watcher runs on worker thread')
	
	FileWatchService.startWatch()
	.catch(err => {
		ApiProxy.logData(config.name, 'error', `Error: ${err}`)
		process.exit(1)
	})
}

export default app

