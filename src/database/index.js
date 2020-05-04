import Sequelize from 'sequelize';

import Users from '../app/models/Users';
import File from '../app/models/File';

import databaseConfig from '../config/database';

const models = [Users, File];

class Database{
    constructor(){
        this.init();
    }

    init(){
        this.connection = new Sequelize(databaseConfig);

        models
        .map(model => model.init(this.connection))
        .map(model => model.associations && model.associate(this.connection.models));
    }
}

export default new Database();