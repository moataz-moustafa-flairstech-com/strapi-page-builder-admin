export default [
  {
    method: 'GET',
    path: '/tenant-files',
    handler: 'api::tenant-file.tenant-file.find',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/tenant-files/:id',
    handler: 'api::tenant-file.tenant-file.findOne',
    config: {
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/tenant-files',
    handler: 'api::tenant-file.tenant-file.create',
    config: {
      policies: [],
    },
  },
  {
    method: 'PUT',
    path: '/tenant-files/:id',
    handler: 'api::tenant-file.tenant-file.update',
    config: {
      policies: [],
    },
  },
  {
    method: 'DELETE',
    path: '/tenant-files/:id',
    handler: 'api::tenant-file.tenant-file.delete',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/tenant-files/upload-file/:documentId',
    handler: 'api::tenant-file.tenant-file.uploadFile',
    config: {
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/tenant-file/UploadNewFile',
    handler: 'api::tenant-file.tenant-file.UploadNewFile',
    config: {
      policies: [],
    },
  },
];
