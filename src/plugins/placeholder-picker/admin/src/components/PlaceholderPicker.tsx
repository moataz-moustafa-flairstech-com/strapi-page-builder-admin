import React, { useState, useEffect } from 'react';
// @ts-ignore: the Strapi admin helper types are not installed in this repo; treat as any for now
import { Box, Button, Typography } from '@strapi/design-system';
// @ts-ignore: the Strapi admin helper types are not installed in this repo; treat as any for now
import { useCMEditViewDataManager, useFetchClient } from '@strapi/helper-plugin';

type Props = { name: string; value: string | null; onChange: (e: any) => void };

const PlaceholderPicker: React.FC<Props> = ({ name, value, onChange }) => {
  const { modifiedData } = useCMEditViewDataManager() as any;
  const { get } = useFetchClient() as any;
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [placeholders, setPlaceholders] = useState<Array<any>>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const open = async () => {
    setIsOpen(true);
    setLoading(true);

    // find the page_template id from the edited entry
    const templateId = modifiedData.page_template?.id || modifiedData.page_template;
    if (!templateId) {
      setPlaceholders([]);
      setLoading(false);
      return;
    }

    try {
      const res = await get(`/api/page-templates/${templateId}?populate=layout.blocks`);
      const data = res.data?.data || res.data;
      // gather placeholders from layout -> blocks
      const ph: Array<any> = [];
      if (data?.layout && Array.isArray(data.layout)) {
        data.layout.forEach((row: any) => {
          if (row.blocks && Array.isArray(row.blocks)) {
            row.blocks.forEach((block: any) => {
              if (block.ui_identifier) ph.push({ name: block.name, ui_identifier: block.ui_identifier });
            });
          }
        });
      }
      setPlaceholders(ph);
    } catch (e) {
      setPlaceholders([]);
    } finally {
      setLoading(false);
    }
  };

  const close = () => setIsOpen(false);

  const select = (ui_identifier: string) => {
    onChange({ target: { name, value: ui_identifier } });
    close();
  };

  return (
    <Box>
      <Button onClick={open} variant="tertiary">Pick placeholder</Button>
      <Box paddingTop={2}>
        <Typography>{value || 'No placeholder selected'}</Typography>
      </Box>

      {isOpen && (
        <Box paddingTop={4} paddingLeft={2} paddingRight={2} background="neutral100">
          <Box paddingBottom={2}>
            <Box>
              <Typography fontWeight="bold">Select placeholder</Typography>
            </Box>
            <Box>
              <Button onClick={close}>Close</Button>
            </Box>
          </Box>
          <Box>
            {loading ? (
              <Typography>Loading...</Typography>
            ) : placeholders.length === 0 ? (
              <Typography>No placeholders found for the selected page template.</Typography>
            ) : (
              placeholders.map((p) => (
                <Box key={p.ui_identifier} paddingBottom={2}>
                  <Button onClick={() => select(p.ui_identifier)} variant="tertiary">{p.name} — {p.ui_identifier}</Button>
                </Box>
              ))
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PlaceholderPicker;