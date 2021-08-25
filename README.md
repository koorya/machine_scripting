
### After clone
Add remotes to other repo of project

	git remote add types https://github.com/koorya/machine_scripting_types.git
	git remote add client  https://github.com/koorya/machine_scripting_ui.git

Install npm modules 

	cd backend && npm i
	cd ../clients/react && npm i

### Run and develop

Lines below start fake PLC, backend in nodemon mode, and ui client (react app).

	cd backend
	npm run start_dev

Those lines start only backend and ui client. Before run this, you should run zmq PLC connector on port 5552

	cd backend
	npm start

### Updating subtree repo
Push changes

	git subtree push --prefix=clients/react client [master|dev]
	git subtree push --prefix=shared/types types master


Pull

	git subtree pull --prefix=clients/react client master
