export default [
  {
    method: 'GET',
    path: '/form-widgets',
    handler: 'api::form-widget.form-widget.find',
    config: {
      auth: false
    }
  },
  {
    method: 'GET',
    path: '/form-widgets/:id',
    handler: 'api::form-widget.form-widget.findOne',
    config: {
      auth: false
    }
  },
  {
    method: 'POST',
    path: '/form-widgets',
    handler: 'api::form-widget.form-widget.create',
    config: {
      auth: false
    }
  },
  {
    method: 'PUT',
    path: '/form-widgets/:id',
    handler: 'api::form-widget.form-widget.update',
    config: {
      auth: false
    }
  },
  {
    method: 'DELETE',
    path: '/form-widgets/:id',
    handler: 'api::form-widget.form-widget.delete',
    config: {
      auth: false
    }
  }
];
