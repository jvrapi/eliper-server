import { Request, Response } from 'express';
import moment from 'moment';
import { getRepository } from 'typeorm';
import * as Yup from 'yup';

import handleErrors from '../errors';
import Disease from '../models/Disease';
import Hospitalization from '../models/Hospitalization';
import Surgery from '../models/Surgery';
import UserSurgery from '../models/UserSurgery';
import { stringFormatter } from '../utils/functions';
import UserSurgeryView from '../views/UserSurgery';

const userSurgeryView = new UserSurgeryView();

interface DefaultFields {
	userId: string;
	hospitalization: Hospitalization;
	afterEffects: string;
}

interface Save extends DefaultFields {
	surgery: string;
}

interface Update extends DefaultFields {
	id: string;
	surgeryId: string;
}

class UserSurgeryController {
	async list(request: Request, response: Response) {
		const { userId } = request.params;
		const requestUserId = request.userId;

		const repository = getRepository(UserSurgery);

		const schema = Yup.string()
			.uuid('Id informado inválido')
			.required('Informe o id');

		try {
			await schema.validate(userId, { abortEarly: false });

			if (userId !== requestUserId) {
				return response
					.status(401)
					.json({ message: 'você não possui acesso a essas informações' });
			}
			const userSurgeries = await repository.find({
				where: { userId },
				relations: ['surgery', 'hospitalization'],
			});

			return response.json(userSurgeryView.list(userSurgeries));
		} catch (error) {
			handleErrors(error, response, 'Erro ao listar as cirurgias do usuário');
		}
	}

	async getById(request: Request, response: Response) {
		const { id } = request.params;
		const requestUserId = request.userId;
		const repository = getRepository(UserSurgery);

		const schema = Yup.string()
			.uuid('Id informado inválido')
			.required('Informe o id ');

		try {
			await schema.validate(id, { abortEarly: false });
			const userSurgery = await repository.findOne({
				where: { id },
			});

			if (userSurgery?.userId !== requestUserId) {
				return response
					.status(401)
					.json({ message: 'Você não possui acesso a essas informações' });
			}

			return response.json(userSurgery);
		} catch (error) {
			handleErrors(error, response, 'Erro ao tentar listar as informações');
		}
	}

	async save(request: Request, response: Response) {
		const {
			userId,
			hospitalization,
			surgery,
			afterEffects,
		}: Save = request.body;

		const repository = getRepository(UserSurgery);

		const surgeryRepository = getRepository(Surgery);

		const hospitalizationRepository = getRepository(Hospitalization);

		const schema = Yup.object().shape({
			userId: Yup.string()
				.uuid('Id informado inválido')
				.required('Informe o id '),

			hospitalization: Yup.object().shape({
				entranceDate: Yup.string()
					.test('date-validation', 'Data não é valida', (date) => {
						const dateIsValid = moment(
							moment(date).toDate(),
							'YYYY-MM-DDThh:mm:ssZ'
						).isValid();

						return dateIsValid;
					})
					.required('Informe a data de entrada'),

				exitDate: Yup.string()
					.nullable()
					.test('date-validation', 'Data não é valida', (date) => {
						if (date) {
							const dateIsValid = moment(
								moment(date).toDate(),
								'YYYY-MM-DDThh:mm:ssZ',
								true
							).isValid();
							return dateIsValid;
						}
						return true;
					}),

				location: Yup.string().required('Informe aonde aconteceu a internação'),
				reason: Yup.string().required('Informe o motivo da internação'),
			}),
			surgery: Yup.string().required('Informe a cirurgia realizada'),

			afterEffects: Yup.string().nullable(),
		});

		const data = { userId, hospitalization, surgery, afterEffects };

		try {
			await schema.validate(data, { abortEarly: false });

			data.hospitalization.diseases = [];
			data.hospitalization.entranceDate = moment(
				data.hospitalization.entranceDate
			).toDate();

			data.hospitalization.exitDate = data.hospitalization.exitDate
				? moment(data.hospitalization.exitDate).toDate()
				: null;
			const hospitalization = hospitalizationRepository.create({
				...data.hospitalization,
				userId,
			});

			await hospitalizationRepository.save(hospitalization);

			const surgeryAlreadyExists = await surgeryRepository.findOne({
				where: { name: surgery },
			});

			let savedSurgery: Surgery;

			if (!surgeryAlreadyExists) {
				savedSurgery = surgeryRepository.create({
					name: stringFormatter(surgery),
				});

				await surgeryRepository.save(savedSurgery);
			} else {
				savedSurgery = surgeryAlreadyExists;
			}

			const UserSurgeryData = {
				userId,
				hospitalizationId: hospitalization.id,
				surgeryId: savedSurgery.id,
				afterEffects,
			};

			const UserSurgery = repository.create(UserSurgeryData);
			await repository.save(UserSurgery);

			return response.status(201).json(UserSurgery);
		} catch (error) {
			handleErrors(error, response, 'Erro ao salvar a cirurgia');
		}
	}

	async update(request: Request, response: Response) {
		const {
			id,
			userId,
			hospitalization,
			surgeryId,
			afterEffects,
		}: Update = request.body;

		const repository = getRepository(UserSurgery);

		const hospitalizationRepository = getRepository(Hospitalization);

		const schema = Yup.object().shape({
			id: Yup.string().uuid('Id informado inválido').required('Informe o id '),

			userId: Yup.string()
				.uuid('Id informado inválido')
				.required('Informe o id '),

			surgeryId: Yup.string()
				.uuid('Id informado inválido')
				.required('Informe o id '),

			hospitalization: Yup.object().shape({
				entranceDate: Yup.string()
					.test('date-validation', 'Data não é valida', (date) => {
						const dateIsValid = moment(
							moment(date).toDate(),
							'YYYY-MM-DDThh:mm:ssZ',
							true
						).isValid();

						return dateIsValid;
					})
					.required('Informe a data de entrada'),

				exitDate: Yup.string()
					.nullable()
					.test('date-validation', 'Data não é valida', (date) => {
						if (date) {
							const dateIsValid = moment(
								moment(date).toDate(),
								'YYYY-MM-DDThh:mm:ssZ',
								true
							).isValid();
							return dateIsValid;
						}
						return true;
					}),

				location: Yup.string().required('Informe aonde aconteceu a internação'),
				reason: Yup.string().required('Informe o motivo da internação'),
				diseases: Yup.array().of(Yup.string().uuid('Id informado inválido')),
			}),

			afterEffects: Yup.string().nullable(),
		});

		const data = { id, userId, hospitalization, surgeryId, afterEffects };

		try {
			await schema.validate(data, { abortEarly: false });

			data.hospitalization.diseases = [];

			data.hospitalization.entranceDate = moment(
				data.hospitalization.entranceDate
			).toDate();

			data.hospitalization.exitDate = data.hospitalization.exitDate
				? moment(data.hospitalization.exitDate).toDate()
				: null;

			const hospitalization = hospitalizationRepository.create({
				...data.hospitalization,
				userId,
			});

			await hospitalizationRepository.save(hospitalization);

			const userSurgeryData = {
				id,
				userId,
				hospitalizationId: hospitalization.id,
				surgeryId,
				afterEffects,
			};

			const userSurgery = repository.create(userSurgeryData);
			await repository.save(userSurgery);

			return response.json(userSurgery);
		} catch (error) {
			handleErrors(error, response, 'Erro ao atualizar a cirurgia');
		}
	}

	async deleteMany(request: Request, response: Response) {
		const surgeriesIds: string[] = request.body;

		const requestUserId = request.userId;

		const repository = getRepository(UserSurgery);

		const schema = Yup.array()
			.min(1, "Informe uma lista com os ID's das doenças")
			.of(Yup.string().uuid('Id informado inválido').required('Informe o id '));

		try {
			await schema.validate(surgeriesIds, { abortEarly: false });
			const res = await Promise.all(
				surgeriesIds.map(async (id) => {
					const userSurgeryInfo = await repository.findOne({
						where: { id: id },
						relations: ['surgery'],
					});

					const res: Record<string, string> = {};

					const surgery = userSurgeryInfo?.surgery.name as string;

					if (userSurgeryInfo?.userId !== requestUserId) {
						res[surgery] = 'Você não pode excluir esse item';
					} else {
						await repository.delete(id);
						res[surgery] = 'Cirurgia excluída com sucesso';
					}

					return res;
				})
			);
			return response.json(res);
		} catch (error) {
			return handleErrors(
				error,
				response,
				'Erro ao excluir as internações do usuário'
			);
		}
	}
}

export default UserSurgeryController;