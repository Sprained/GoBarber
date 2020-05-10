import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore } from 'date-fns'
import Appointment from '../models/Appointment';
import Users from '../models/Users';
import File from '../models/File';

class AppointmentController{
    async index(req, res){
        const { page = 1 } = req.query;

        const appointments = await Appointment.findAll({
            where: { user_id: req.userId, canceled_at: null },
            order: ['date'],
            limit: 20,
            offset: (page - 1) * 20,
            attributes: ['id', 'date'],
            include: [
                {
                    model: Users,
                    as: 'provider',
                    attributes: ['id', 'name'],
                    include: [
                        {
                            model: File,
                            as: 'avatar',
                            attributes: ['id', 'path', 'url']
                        }
                    ]
                }
            ]
        })

        return res.json(appointments);
    }

    async store(req, res){
        const schema = Yup.object().shape({
            provider_id: Yup.number().required(),
            date: Yup.date().required()
        });

        if(!(await schema.isValid(req.body))){
            return res.status(400).json({ error: 'Validation fails' });
        }

        const { provider_id, date } = req.body;

        // Check is provider_id is a provider
        const isProvider = await Users.findOne({
            where: { id: provider_id, provider: true }
        });

        if(!isProvider){
            return res.status(401).json({ error: 'You can only create appointments with providers' });
        }

        //check for past dates
        const houtStart = startOfHour(parseISO(date));

        if(isBefore(houtStart, new Date())){
            return res.status(400).json({ error: 'Past dates are not permitted' });
        }

        //check date avaibility
        const checkAvailability = await Appointment.findOne({
            where: { provider_id, canceled_at: null, date: houtStart }
        });

        if(checkAvailability){
            return res.status(400).json({ error: 'Appointment date is note available' });
        }

        const appointment = await Appointment.create({
            user_id: req.userId,
            provider_id,
            date
        });

        return res.json(appointment);
    }
}

export default new AppointmentController();