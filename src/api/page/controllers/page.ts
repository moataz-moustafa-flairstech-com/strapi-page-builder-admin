/**
 * page controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::page.page', ({ strapi }) => ({
  // Extend core controller with validation hook for create/update
  async create(ctx) {
    strapi.log.info('Page create requested with body: ' + JSON.stringify(ctx.request.body));
    // No placeholder identifier validation required after removing placeholder components
    const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;

    if (!tokenTenant) {
      return ctx.badRequest('Missing tenant_id in token');
    }

    strapi.log.info('Creating page: calling base class for tenant_id=' + tokenTenant + ' with body: ' + JSON.stringify(ctx.request.body));
    // ensure tenant_id is set from token and mandatory
    ctx.request.body = ctx.request.body || {};
    ctx.request.body.data = ctx.request.body.data || {};
    ctx.request.body.data.tenant_id = tokenTenant;
    strapi.log.info('Creating page: second log calling base class for tenant_id=' + tokenTenant + ' with body: ' + JSON.stringify(ctx.request.body));
    const created = await super.create(ctx);
    return created;
  },


  async CopyPage(ctx) {
      // Update by documentId (draft) and ensure tenant matches. Also update published version if present.
    const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;
    strapi.log.info('CopyPage: Page copy requested with ctx.params: ' + JSON.stringify(ctx.params));
    const { id, id2 } = ctx.params || {};

    const copyFromDocumentId = id;
    strapi.log.info('CopyPage: documentId: ' + copyFromDocumentId);
    if (!copyFromDocumentId) return ctx.badRequest('CopyPage: Entity is missing documentId');



    const copyToDocumentId = id2;
    strapi.log.info('CopyPage: copyToDocumentId: ' + copyToDocumentId);
    if (!copyToDocumentId) return ctx.badRequest('CopyPage: Entity is missing copyToDocumentId');

    try{
      if(copyFromDocumentId && copyToDocumentId) {
        strapi.log.info('Copying layout_structure from documentId=' + copyFromDocumentId + ' to new page documentId=' + copyToDocumentId);
        // Fetch the draft page to copy from
        const sourceDraft = await strapi.documents('api::page.page').findOne({
          documentId: String(copyFromDocumentId),
          status: 'draft',
          populate: {
            sections: {
               populate: {
                blocks: true
              }
            }, 
            page_template: true
        }
      });

        if (sourceDraft) {
          // Helper function to remove IDs from any object
          const removeIds = (obj: any): any => {
            if (!obj || typeof obj !== 'object') return obj;
            
            if (Array.isArray(obj)) {
              return obj.map(removeIds);
            }
            
            const { id, ...objWithoutId } = obj;
            const result: any = {};
            
            for (const [key, value] of Object.entries(objWithoutId)) {
              result[key] = removeIds(value);
            }
            
            return result;
          };

          // Helper function to ensure required fields for specific components
          const processBlock = (block: any): any => {
            const cleanBlock = removeIds(block);
            
            switch (cleanBlock.__component) {
              case 'shared.external-content':
                return {
                  ...cleanBlock,
                  name: cleanBlock.name ?? "",
                  url: cleanBlock.url ?? "",
                  live: cleanBlock.live ?? false,
                  refresh_rate: cleanBlock.refresh_rate ?? 0,
                };
              
              case 'shared.accordion-list':
                return {
                  ...cleanBlock,
                  items: Array.isArray(cleanBlock.items) 
                    ? cleanBlock.items.map((item: any) => ({
                        ...removeIds(item),
                        title: item.title || "",
                        description: item.description || ""
                      }))
                    : cleanBlock.items
                };
              
              case 'shared.media':
                return {
                  ...cleanBlock,
                  file: cleanBlock.file ? removeIds(cleanBlock.file) : null
                };
              
              case 'shared.slider':
                return {
                  ...cleanBlock,
                  files: Array.isArray(cleanBlock.files) 
                    ? cleanBlock.files.map(removeIds)
                    : cleanBlock.files
                };
              
              case 'shared.cards-list':
                return {
                  ...cleanBlock,
                  cards: Array.isArray(cleanBlock.cards) 
                    ? cleanBlock.cards.map(removeIds)
                    : cleanBlock.cards
                };
              
              case 'shared.drop-down-list':
                return {
                  ...cleanBlock,
                  options: Array.isArray(cleanBlock.options) 
                    ? cleanBlock.options.map(removeIds)
                    : cleanBlock.options
                };
              
              case 'shared.radio-buttons-list':
                return {
                  ...cleanBlock,
                  options: Array.isArray(cleanBlock.options) 
                    ? cleanBlock.options.map(removeIds)
                    : cleanBlock.options
                };
              
              case 'shared.bulleted-list':
                return {
                  ...cleanBlock,
                  items: Array.isArray(cleanBlock.items) 
                    ? cleanBlock.items.map(removeIds)
                    : cleanBlock.items
                };
              
              case 'shared.grid':
                return {
                  ...cleanBlock,
                  columns: Array.isArray(cleanBlock.columns) 
                    ? cleanBlock.columns.map(removeIds)
                    : cleanBlock.columns
                };
              
              case 'shared.layout-repeater':
                return {
                  ...cleanBlock,
                  items: Array.isArray(cleanBlock.items) 
                    ? cleanBlock.items.map(removeIds)
                    : cleanBlock.items
                };
              
              case 'shared.article-selector':
                return {
                  ...cleanBlock,
                  article: cleanBlock.article ? removeIds(cleanBlock.article) : null
                };
              
              case 'shared.form-selector':
                return {
                  ...cleanBlock,
                  form: cleanBlock.form ? removeIds(cleanBlock.form) : null
                };
              
              case 'shared.seo':
                return {
                  ...cleanBlock,
                  meta_title: cleanBlock.meta_title || "",
                  meta_description: cleanBlock.meta_description || ""
                };
              
              // Handle all other component types with generic ID removal
              default:
                return cleanBlock;
            }
          };

          // Copy sections (including blocks) and layout_structure into the new page
          const updated = await strapi.documents('api::page.page').update({
            documentId: copyToDocumentId,
            status: 'draft',
            data: {
              sections: Array.isArray(sourceDraft.sections)
                ? sourceDraft.sections.map(section => {
                    const cleanSection = removeIds(section);
                    return {
                      ...cleanSection,
                      blocks: Array.isArray(cleanSection.blocks)
                        ? cleanSection.blocks.map(processBlock)
                        : cleanSection.blocks,
                      style: cleanSection.style ? removeIds(cleanSection.style) : cleanSection.style
                    };
                  })
                : sourceDraft.sections,
              layout_structure: sourceDraft.layout_structure,
              page_template: {id: sourceDraft?.page_template?.id || null}
            }
          });

          return updated;
        } else {
          strapi.log.warn(`Source draft page not found for documentId=${copyFromDocumentId}`);
          return ctx.notFound('Source Document does not exist');
  
        }

      }

    }
    catch (err) {
      strapi.log.error('Error creating page with copy from ' + copyFromDocumentId + ':', err);
      return ctx.internalServerError('CopyPage: Entity is missing copyToDocumentId:' + err);
    
    }

    return ctx.internalServerError('CopyPage: Entity is missing copyToDocumentId');

  
  },


  async tenantUpdate(ctx) {
      // Update by documentId (draft) and ensure tenant matches. Also update published version if present.
    const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;
    strapi.log.info('tenantUpdate: Page update requested with ctx.params: ' + JSON.stringify(ctx.params));
    const { id } = ctx.params || {};

    const documentId = id;
    strapi.log.info('tenantUpdate: documentId: ' + documentId);
    if (!documentId) return ctx.badRequest('tenantUpdate: Entity is missing documentId');

    // Find draft document by documentId
    const draft = await strapi.documents('api::page.page').findOne({ documentId, status: 'draft', populate: {} as any });
    if (!draft) return ctx.notFound('Draft not found');

    const existingTenant = (draft as any)?.tenant_id;
    if (typeof tokenTenant !== 'undefined' && existingTenant !== tokenTenant) {
      return ctx.forbidden('You are not allowed to modify this entry');
    }

     // prevent tenant_id from changing
     if (ctx.request?.body?.data) {
       delete ctx.request.body.data.tenant_id;
    }

    strapi.log.info('Updating draft documentId=' + documentId + ' (internal id=' + ctx.params.id + ') for tenant_id=' + existingTenant);
    strapi.log.info('Update data: ' + JSON.stringify(ctx.request?.body));

    let updateData: any = ctx.request?.body?.data || {};
    // sanitize incoming payload to avoid nested id wrappers and internal id fields
    const removeIds = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(removeIds);
      const out: any = {};
      for (const [k, v] of Object.entries(obj)) {
        if (k === 'id') continue; // drop internal id fields
        out[k] = removeIds(v as any);
      }
      return out;
    };

    // Normalize page_template that may be sent as { id: { id: 4 } }
    try {
      if (updateData.page_template && typeof updateData.page_template === 'object') {
        if (updateData.page_template.id && typeof updateData.page_template.id === 'object' && updateData.page_template.id.id) {
          updateData.page_template = { id: updateData.page_template.id.id };
        }
      }

      // Normalize style.background_image to { id: <num> } if a full file object was supplied
      if (updateData.style && updateData.style.background_image && typeof updateData.style.background_image === 'object') {
        if (updateData.style.background_image.id) {
          updateData.style = updateData.style || {};
          updateData.style.background_image = { id: updateData.style.background_image.id };
        }
      }

      // Remove component/internal ids from sections and blocks so Strapi validation doesn't reject them
      if (Array.isArray(updateData.sections)) {
        updateData.sections = updateData.sections.map((s: any) => {
          const cleanSection = removeIds(s);
          if (cleanSection.blocks && Array.isArray(cleanSection.blocks)) {
            cleanSection.blocks = cleanSection.blocks.map((b: any) => removeIds(b));
          }
          return cleanSection;
        });
      }

      // Finally run a full removeIds on updateData to sanitize any remaining internal ids
      updateData = removeIds(updateData);
    } catch (e) {
      strapi.log.error('Error sanitizing updateData before documents.update', e);
    }

    const updated = await strapi.documents('api::page.page').update({
      documentId,
      status: 'draft',
      data: updateData,
    });
    strapi.log.info('Finished updating draft documentId=' + documentId + ' (internal id=' + ctx.params.id + ') for tenant_id=' + existingTenant);

    // Also update the published version with the same data if it exists and belongs to the same tenant
    try {
      const published = await strapi
        .documents('api::page.page')
        .findOne({ documentId, status: 'published' });

      if (published && (!tokenTenant || published.tenant_id === tokenTenant)) {
        await strapi.documents('api::page.page').update({
          documentId,
          status: 'published',
          data: updateData,
        });
      }
    } catch (err) {
      strapi.log.error('Error updating published document after draft update:', err);
    }

    return updated;

  
  },
  

  // Tenant-aware publish action
  async publish(ctx) {
    const { id: documentId } = ctx.params || {};
    const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;

    if (!documentId) return ctx.badRequest('Missing document id');
    if (!tokenTenant) return ctx.badRequest('Missing tenant_id in token');

    try {
      // Ensure draft exists and belongs to tenant
      const draft = await strapi.documents('api::page.page').findOne({ documentId, status: 'draft', populate: {} as any });
      if (!draft) return ctx.notFound('Draft not found');

      const existingTenant = (draft as any)?.tenant_id;
      if (typeof tokenTenant !== 'undefined' && existingTenant !== tokenTenant) {
        return ctx.forbidden('You are not allowed to publish this entry');
      }

      const published = await strapi.documents('api::page.page').publish({ documentId });
      if (!published) return ctx.internalServerError('Publish failed');

      return this.transformResponse(published);
    } catch (err) {
      strapi.log.error('Error publishing page document:', err);
      return ctx.internalServerError('Error publishing page');
    }
  },

  // Custom preview method to handle both draft and published content
  async preview(ctx) {
    const { id } = ctx.params;
    const { status = 'draft' } = ctx.query;

    try {
      strapi.log.info(`Page preview request - ID: ${id}, Status: ${status}`);
      
    // Fetch the page document (draft or published)
    const entity = await strapi.documents('api::page.page').findOne({
      documentId: id,
      status: status as 'draft' | 'published',
      populate: {
        sections: {
          populate: {
            blocks: {
              on: {
                'shared.external-content': true,
                'shared.media': { populate: { file: true } },
                'shared.quote': true,
                'shared.rich-text': true,
                'shared.slider': { populate: { files: true } },
                'shared.accordion-list': true,
                'shared.accordion-list-item': true,
                'shared.article-selector': { populate: { article: true } },
                'shared.bulleted-list': true,
                'shared.button-input': true,
                'shared.cards-list': true,
                'shared.check-box-input': true,
                'shared.drop-down-list': true,
                'shared.facebook-feed': true,
                'shared.form-file-input': true,
                'shared.form-selector': { populate: { form_widget: true } },
                'shared.form-text-input': true,
                'shared.google-map-widget': true,
                'shared.grid': true,
                'shared.html-block': true,
                'shared.instagram-feed': true,
                'shared.layout-repeater': true,
                'shared.page-header-tag': true,
                'shared.place-holder': true,
                'shared.radio-buttons-list': true,
                'shared.selection-item': true,
                'shared.seo': true,
                'shared.social-media-link': true,
                'shared.tag-attribute': true,
                'shared.youtube-player': true,
              },
            },
            style: {
              populate: {
                background_image: true
              }
            }
          },
        },
        style: {
          populate: {
            background_image: true
          }
        },
        // request only minimal info so we can hydrate later
        page_template: true
      }
    });

    if (!entity) {
      strapi.log.warn(`Page not found - ID: ${id}, Status: ${status}`);
      return ctx.notFound('Page not found or not available in the requested status');
    }

    //strapi.log.info(`Fetched page entity for preview: ${JSON.stringify(entity)}`);
    // Hydrate page_template if present
    // const templateId =      entity?.page_template?.id || entity?.page_template?.documentId;
    // const templateId = entity?.page_template?.documentId;

    // if (templateId) {
    //   const template = await strapi.entityService.findOne(
    //     'api::page-template.page-template',
    //     templateId,
    //     {
    //       populate: {
    //         layout: {
    //           populate: {
    //             blocks: true,
    //           },
    //         },
    //       },
    //     }
    //   );
    //   entity.page_template = template;
    // }



      // Transform the data if needed
      //const sanitizedEntity = await this.sanitizeOutput(entity, ctx);


      //strapi.log.info(`sanitizedEntity: ${JSON.stringify(sanitizedEntity)}`);

      const transformedResponse = this.transformResponse(entity);
      strapi.log.info(`transformedResponse for preview: ${JSON.stringify(transformedResponse)}`);

      return transformedResponse;
    } catch (err) {
      strapi.log.error('Error in page preview:', err);
      return ctx.internalServerError('Error fetching page for preview');
    }
  },

  // Update only the layout_structure for a specific document (draft or published)
  async updateLayoutStructure(ctx) {
    // Expecting route: PUT /api/pages/:id/updateLayoutStructure?status=<draft|published>
    if (ctx.method !== 'PUT') return ctx.methodNotAllowed('Only PUT allowed');

    const { id } = ctx.params || {};
    const { status = 'draft' } = ctx.query || {};

    if (!id) return ctx.badRequest('Missing document id');
    if (status !== 'draft' && status !== 'published') return ctx.badRequest('Invalid status, expected "draft" or "published"');

    const layout_structure = ctx.request?.body?.data?.layout_structure;
    if (typeof layout_structure === 'undefined') {
      return ctx.badRequest('Missing layout_structure in request body (expected { data: { layout_structure: ... } })');
    }

    try {
      const updated = await strapi.documents('api::page.page').update({
        documentId: id,
        status: status as 'draft' | 'published',
        data: { layout_structure },
      });

      if (!updated) return ctx.notFound('Page not found for the given document id and status');

      // Return the transformed response for consistency with other controllers
      return this.transformResponse(updated);
    } catch (err) {
      strapi.log.error('Error updating layout_structure:', err);
      return ctx.internalServerError('Error updating layout_structure');
    }
  },

  // Override find to support publicationState=preview (include drafts)
  async find(ctx) {
    const qs: any = ctx.query || {};
    try {
      if (qs.publicationState === 'preview') {
        // pagination
        const page = qs['pagination[page]'] ? parseInt(String(qs['pagination[page]']), 10) || 1 : 1;
        const pageSize = qs['pagination[pageSize]'] ? parseInt(String(qs['pagination[pageSize]']), 10) || 25 : 25;
        const start = (page - 1) * pageSize;

        // populate
        const populate = qs.populate || '*';

        // Extract tenant filter from query filters if present
        const filters = qs.filters || {};
        const tenantFilter =
          filters?.tenant_id?.['$eq'] !== undefined
            ? filters.tenant_id['$eq']
            : filters?.tenant_id ?? undefined;

        // If tenant filter is provided but is empty string or null, return empty result
        if (typeof tenantFilter !== 'undefined' && (tenantFilter === '' || tenantFilter === null)) {
          return ctx.send({
            data: [],
            meta: { pagination: { page, pageSize, pageCount: 0, total: 0 } },
          });
        }

        // Build entityService filters if tenantFilter present
        const esFilters: any = {};
        if (typeof tenantFilter !== 'undefined') {
          esFilters.tenant_id = { $eq: tenantFilter };
        }

        // fetch items including drafts (apply tenant filter if present)
        const entities = await strapi.entityService.findMany('api::page.page', {
          publicationState: 'preview',
          populate,
          limit: pageSize,
          start,
          ...(Object.keys(esFilters).length ? { filters: esFilters } : {}),
        });

        // total count, respect tenant filter when present
        const total = typeof tenantFilter !== 'undefined'
          ? await strapi.db.query('api::page.page').count({ where: { tenant_id: tenantFilter } })
          : await strapi.db.query('api::page.page').count();

        const pageCount = pageSize > 0 ? Math.ceil(total / pageSize) : 0;

        return ctx.send({
          data: entities,
          meta: {
            pagination: {
              page,
              pageSize,
              pageCount,
              total,
            },
          },
        });
      }

      // Otherwise fall back to default behavior
      return await super.find(ctx);
    } catch (err) {
      strapi.log.error('Error in custom find for pages:', err);
      return ctx.internalServerError('Error fetching pages');
    }
  },

  // Delete all versions (draft and published) of a page by documentId
  async DeleteByDocumentId(ctx) {
    const { documentId } = ctx.params || {};
    const tokenTenant = ctx.state?.tenantIdFromToken || ctx.state?.jwtPayload?.tenant_id || ctx.state?.user?.tenant_id;

    if (!documentId) {
      return ctx.badRequest('Missing documentId parameter');
    }

    try {
      strapi.log.info(`DeleteByDocumentId: Attempting to delete all versions of page with documentId: ${documentId}`);

      // First, verify tenant ownership by checking if any version exists and belongs to the user's tenant
      const draftCheck = await strapi.documents('api::page.page').findOne({
        documentId,
        status: 'draft',
        populate: {} as any
      });

      const publishedCheck = await strapi.documents('api::page.page').findOne({
        documentId,
        status: 'published',
        populate: {} as any
      });

      // If neither draft nor published exists, return 404
      if (!draftCheck && !publishedCheck) {
        strapi.log.warn(`DeleteByDocumentId: No page found with documentId: ${documentId}`);
        return ctx.notFound(`No page found with documentId: ${documentId}`);
      }

      // Check tenant ownership on whichever version exists
      const existingPage = draftCheck || publishedCheck;
      const existingTenant = (existingPage as any)?.tenant_id;
      
      if (typeof tokenTenant !== 'undefined' && existingTenant !== tokenTenant) {
        strapi.log.warn(`DeleteByDocumentId: Forbidden - tenant mismatch for documentId: ${documentId}`);
        return ctx.forbidden('You are not allowed to delete this page');
      }

      // Delete draft version if it exists
      if (draftCheck) {
        try {
          await strapi.documents('api::page.page').delete({
            documentId,
            status: 'draft'
          });
          strapi.log.info(`DeleteByDocumentId: Successfully deleted draft version of documentId: ${documentId}`);
        } catch (err) {
          const errorMsg = `Failed to delete draft version: ${err instanceof Error ? err.message : String(err)}`;
          strapi.log.error(`DeleteByDocumentId: ${errorMsg}`, err);
        }
      }

      // Delete published version if it exists
      if (publishedCheck) {
        try {
          await strapi.documents('api::page.page').delete({
            documentId,
            status: 'published'
          });
          strapi.log.info(`DeleteByDocumentId: Successfully deleted published version of documentId: ${documentId}`);
        } catch (err) {
          const errorMsg = `Failed to delete published version: ${err instanceof Error ? err.message : String(err)}`;
          strapi.log.error(`DeleteByDocumentId: ${errorMsg}`, err);
        }
      }

      // Success - return 204 No Content
      strapi.log.info(`DeleteByDocumentId: Successfully deleted all  versions of documentId: ${documentId}`);
      return ctx.send(null, 204);

    } catch (err) {
      const errorMessage = `Unexpected error while deleting page versions for documentId ${documentId}: ${err instanceof Error ? err.message : String(err)}`;
      strapi.log.error(`DeleteByDocumentId: ${errorMessage}`, err);
      
      return ctx.send(
        { 
          error: errorMessage,
          details: err instanceof Error ? err.stack : String(err)
        },
        500
      );
    }
  }

}));