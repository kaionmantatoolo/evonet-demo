"use client";

import { Box, Typography } from "@mui/material";
import { enterUp } from "../storefrontMotion";

const BLACK_MODEL_THUMBS = [
  {
    src: "/storefront/hoodie-black-front.png",
    alt: "Model in black Founder zip hoodie, front",
    objectPosition: "50% 8%",
  },
  {
    src: "/storefront/hoodie-black-back.png",
    alt: "Model in black Founder zip hoodie, back",
    objectPosition: "50% 12%",
  },
  {
    src: "/storefront/hoodie-black-hood.png",
    alt: "Close-up of Anon Tokyo mark on black hoodie hood",
    objectPosition: "50% 18%",
  },
] as const;

interface FanClubModelStripProps {
  title?: string;
}

/** Black-hoodie model thumbnails under the Fan Club hero. */
export function FanClubModelStrip({ title }: FanClubModelStripProps) {
  return (
    <Box sx={{ ...enterUp(200, 620) }}>
      {title ? (
        <Typography
          variant="overline"
          sx={{
            display: "block",
            color: "var(--shop-muted)",
            letterSpacing: 1.6,
            mb: 1.75,
          }}
        >
          {title}
        </Typography>
      ) : null}
      <Box
        sx={{
          display: "grid",
          gap: { xs: 1.25, md: 1.75 },
          gridTemplateColumns: {
            xs: "repeat(3, minmax(0, 1fr))",
          },
        }}
      >
        {BLACK_MODEL_THUMBS.map((shot) => (
          <Box
            key={shot.src}
            sx={{
              borderRadius: { xs: 1.5, md: 2 },
              overflow: "hidden",
              bgcolor: "#111111",
              aspectRatio: "3 / 4",
              boxShadow: "0 14px 36px rgba(15, 23, 42, 0.1)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <Box
              component="img"
              src={shot.src}
              alt={shot.alt}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: shot.objectPosition,
                display: "block",
                transition: "transform 650ms cubic-bezier(0.22, 1, 0.36, 1)",
                "&:hover": { transform: "scale(1.04)" },
              }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
