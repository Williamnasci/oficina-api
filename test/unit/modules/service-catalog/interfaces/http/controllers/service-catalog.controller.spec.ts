import { ServiceCatalogController } from '../../../../../../../src/modules/service-catalog/interfaces/http/controllers/service-catalog.controller';

describe('ServiceCatalogController', () => {
  let controller: ServiceCatalogController;
  let createMock: any;
  let getMock: any;
  let listMock: any;
  let updateMock: any;
  let deleteMock: any;

  beforeEach(() => {
    createMock = { execute: jest.fn().mockResolvedValue({ id: '1' }) };
    getMock = { execute: jest.fn().mockResolvedValue({ id: '1', name: 'A' }) };
    listMock = {
      execute: jest.fn().mockResolvedValue([{ id: '1', name: 'A' }]),
    };
    updateMock = { execute: jest.fn().mockResolvedValue(undefined) };
    deleteMock = { execute: jest.fn().mockResolvedValue(undefined) };

    controller = new ServiceCatalogController(
      createMock,
      getMock,
      listMock,
      updateMock,
      deleteMock,
    );
  });

  it('should create', async () => {
    const result = await controller.create({ name: 'A', price: 10 });
    expect(result).toEqual({ id: '1' });
  });

  it('should list', async () => {
    const result = await controller.findAll();
    expect(result.length).toBe(1);
  });

  it('should update', async () => {
    await controller.update('1', { name: 'B' });
    expect(updateMock.execute).toHaveBeenCalled();
  });

  it('should get', async () => {
    await controller.findById('1');
    expect(getMock.execute).toHaveBeenCalled();
  });

  it('should delete', async () => {
    await controller.delete('1');
    expect(deleteMock.execute).toHaveBeenCalled();
  });
});
