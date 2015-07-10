import Ember from 'ember';
import C from 'ui/utils/constants';
import EditLabels from 'ui/mixins/edit-labels';

export default Ember.Mixin.create(EditLabels, {
  primaryResource: Ember.computed.alias('model.service'),
  labelResource: Ember.computed.alias('model.service.launchConfig'),

  actions: {
    addServiceLink: function() {
      this.get('serviceLinksArray').pushObject(Ember.Object.create({name: '', serviceId: null}));
    },
    removeServiceLink: function(obj) {
      this.get('serviceLinksArray').removeObject(obj);
    },
  },

  initFields: function() {
    this._super();
    this.initServiceLinks();
    this.initScheduling();
  },

  // ----------------------------------
  // Services
  // ----------------------------------
  serviceChoices: function() {
    var env = this.get('model.selectedEnvironment');
    var group = 'Stack: ' + (env.get('name') || '('+env.get('id')+')');

    var list = (env.get('services')||[]).map((service) => {
      var serviceLabel = (service.get('name') || '('+service.get('id')+')');
      if ( service.get('state') !== 'active' )
      {
        serviceLabel += ' (' + service.get('state') + ')';
      }

      return Ember.Object.create({
        group: group,
        id: service.get('id'),
        name: serviceLabel,
        obj: service,
      });
    });

    return list.sortBy('group','name','id');
  }.property('environment.services.@each.{id,name,state}'),

  serviceLinksArray: null,
  initServiceLinks: function() {
    var out = [];
    var links;
    if ( this.get('service.id') )
    {
      // Edit
      links = this.get('service.consumedServicesWithNames')||[];
    }
    else
    {
      // New / Clone
      links = this.get('service.serviceLinks')||[];
    }

    links.forEach(function(obj) {
      var name = obj.get('name');
      var service = obj.get('service');

      out.push(Ember.Object.create({
        name: (name === service.get('name') ? '' : name),
        obj: service,
        serviceId: service.get('id'),
      }));
    });

    this.set('serviceLinksArray', out);
  },

  serviceLinksDidChange: function() {
  }.observes('serviceLinksArray.@each.{name,serviceId}'),

  // ----------------------------------
  // Scheduling
  // ----------------------------------
  isGlobal: null,
  initScheduling: function() {
    var existing = this.getLabel(C.LABEL.SCHED_GLOBAL);
    this.set('isGlobal', !!existing);
    this._super();
    if ( this.get('isRequestedHost') )
    {
      this.set('isGlobal', false);
    }
  },

  globalDidChange: function() {
    if ( this.get('isGlobal') )
    {
      this.setLabel(C.LABEL.SCHED_GLOBAL,'true');
      this.set('isRequestedHost', false);
    }
    else
    {
      this.removeLabel(C.LABEL.SCHED_GLOBAL);
    }
  }.observes('isGlobal'),

  isRequestedHostDidChangeGlobal: function() {
    if ( this.get('isRequestedHost') )
    {
      this.set('isGlobal', false);
    }
  }.observes('isRequestedHost'),

  // ----------------------------------
  // Save
  // ----------------------------------
  didSave: function() {
    var service = this.get('model.service');
    var ary = [];
    this.get('serviceLinksArray').forEach((row) => {
      if ( row.serviceId )
      {
        ary.push({name: row.name, serviceId: row.serviceId});
      }
    });

    return service.doAction('setservicelinks', {serviceLinks: ary});
  },
});
